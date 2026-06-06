use serde::{Deserialize, Serialize};
use std::process::Stdio;
use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;

// ── Types ──────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SerialPort {
    pub name: String,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FlashEntry {
    pub address: String,
    pub path: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FlashArgs {
    pub port: String,
    pub baud: String,
    pub chip: String,
    pub flash_mode: String,
    pub entries: Vec<FlashEntry>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ReadArgs {
    pub port: String,
    pub baud: String,
    pub chip: String,
    pub address: String,
    pub size: String,
    pub output: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LogLine {
    pub level: String, // "info" | "ok" | "warn" | "error" | "progress"
    pub text: String,
    pub progress: Option<f32>,
}

// ── Commands ───────────────────────────────────────────────────────────────

/// List available serial ports
#[tauri::command]
fn list_ports() -> Vec<SerialPort> {
    match serialport::available_ports() {
        Ok(ports) => ports
            .into_iter()
            .filter(|p| {
                // Keep only USB/ACM serial ports, skip bluetooth etc
                matches!(
                    &p.port_type,
                    serialport::SerialPortType::UsbPort(_)
                        | serialport::SerialPortType::PciPort
                        | serialport::SerialPortType::Unknown
                )
            })
            .map(|p| {
                let description = match &p.port_type {
                    serialport::SerialPortType::UsbPort(info) => {
                        format!(
                            "{} {}",
                            info.manufacturer.clone().unwrap_or_default(),
                            info.product.clone().unwrap_or_default()
                        )
                        .trim()
                        .to_string()
                    }
                    _ => String::new(),
                };
                SerialPort {
                    name: p.port_name,
                    description,
                }
            })
            .collect(),
        Err(_) => vec![],
    }
}

/// Run esptool with the given args, streaming output line-by-line via events
async fn run_esptool_streaming(app: AppHandle, args: Vec<String>) -> Result<(), String> {
    let mut cmd = Command::new("esptool.py");
    cmd.args(&args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    let mut child = cmd.spawn().map_err(|e| {
        if e.kind() == std::io::ErrorKind::NotFound {
            "esptool.py not found in PATH. Install it: pip install esptool".to_string()
        } else {
            format!("Failed to start esptool: {e}")
        }
    })?;

    // Stream stdout
    let stdout = child.stdout.take().unwrap();
    let stderr = child.stderr.take().unwrap();
    let app_out = app.clone();
    let app_err = app.clone();

    let out_task = tokio::spawn(async move {
        let mut reader = BufReader::new(stdout).lines();
        while let Ok(Some(line)) = reader.next_line().await {
            let log = parse_line(&line);
            let _ = app_out.emit("esptool-log", log);
        }
    });

    let err_task = tokio::spawn(async move {
        let mut reader = BufReader::new(stderr).lines();
        while let Ok(Some(line)) = reader.next_line().await {
            // esptool prints progress to stderr
            let log = parse_line(&line);
            let _ = app_err.emit("esptool-log", log);
        }
    });

    let status = child.wait().await.map_err(|e| e.to_string())?;
    let _ = out_task.await;
    let _ = err_task.await;

    if status.success() {
        let _ = app.emit(
            "esptool-log",
            LogLine {
                level: "ok".into(),
                text: "Done.".into(),
                progress: Some(100.0),
            },
        );
        let _ = app.emit("esptool-done", true);
        Ok(())
    } else {
        let msg = format!(
            "esptool exited with code {}",
            status.code().unwrap_or(-1)
        );
        let _ = app.emit(
            "esptool-log",
            LogLine {
                level: "error".into(),
                text: msg.clone(),
                progress: None,
            },
        );
        let _ = app.emit("esptool-done", false);
        Err(msg)
    }
}

fn parse_line(line: &str) -> LogLine {
    // Detect progress lines like: "Writing at 0x00010000... (50 %)"
    let progress = if line.contains('%') {
        let s = line
            .split('(')
            .last()
            .and_then(|s| s.split('%').next())
            .and_then(|s| s.trim().parse::<f32>().ok());
        s
    } else {
        None
    };

    let level = if line.starts_with("WARNING") || line.starts_with("WARN") || line.contains("⚠") {
        "warn"
    } else if line.starts_with("ERROR") || line.starts_with("error:") || line.contains("Failed") {
        "error"
    } else if line.starts_with("Hash of data verified")
        || line.contains("Leaving...")
        || line.starts_with("Done")
    {
        "ok"
    } else if progress.is_some() {
        "progress"
    } else {
        "info"
    };

    LogLine {
        level: level.into(),
        text: line.to_string(),
        progress,
    }
}

/// Write flash (write_flash command)
#[tauri::command]
async fn flash(app: AppHandle, args: FlashArgs) -> Result<(), String> {
    let mut cmd_args = vec![
        "--port".into(),
        args.port.clone(),
        "--baud".into(),
        args.baud.clone(),
    ];

    if args.chip != "auto" {
        cmd_args.push("--chip".into());
        cmd_args.push(args.chip.clone());
    }

    cmd_args.push("write_flash".into());
    cmd_args.push("--flash_mode".into());
    cmd_args.push(args.flash_mode.clone());

    for entry in &args.entries {
        cmd_args.push(entry.address.clone());
        cmd_args.push(entry.path.clone());
    }

    run_esptool_streaming(app, cmd_args).await
}

/// Read flash to a file
#[tauri::command]
async fn read_flash(app: AppHandle, args: ReadArgs) -> Result<(), String> {
    let mut cmd_args = vec![
        "--port".into(),
        args.port.clone(),
        "--baud".into(),
        args.baud.clone(),
    ];

    if args.chip != "auto" {
        cmd_args.push("--chip".into());
        cmd_args.push(args.chip.clone());
    }

    cmd_args.extend(vec![
        "read_flash".into(),
        args.address.clone(),
        args.size.clone(),
        args.output.clone(),
    ]);

    run_esptool_streaming(app, cmd_args).await
}

/// Erase entire flash
#[tauri::command]
async fn erase_flash(
    app: AppHandle,
    port: String,
    baud: String,
    chip: String,
) -> Result<(), String> {
    let mut cmd_args = vec!["--port".into(), port, "--baud".into(), baud];
    if chip != "auto" {
        cmd_args.push("--chip".into());
        cmd_args.push(chip);
    }
    cmd_args.push("erase_flash".into());
    run_esptool_streaming(app, cmd_args).await
}

/// Get chip info (chip_id command)
#[tauri::command]
async fn chip_info(
    app: AppHandle,
    port: String,
    baud: String,
    chip: String,
) -> Result<(), String> {
    let mut cmd_args = vec!["--port".into(), port, "--baud".into(), baud];
    if chip != "auto" {
        cmd_args.push("--chip".into());
        cmd_args.push(chip);
    }
    cmd_args.push("chip_id".into());
    run_esptool_streaming(app, cmd_args).await
}

/// Build the CLI command string for display in the UI
#[tauri::command]
fn build_flash_cmd(args: FlashArgs) -> String {
    let mut parts = vec!["esptool.py".to_string()];

    parts.push("--port".into());
    parts.push(args.port.clone());
    parts.push("--baud".into());
    parts.push(args.baud.clone());

    if args.chip != "auto" {
        parts.push("--chip".into());
        parts.push(args.chip.clone());
    }

    parts.push("write_flash".into());
    parts.push("--flash_mode".into());
    parts.push(args.flash_mode.clone());

    for entry in &args.entries {
        parts.push(entry.address.clone());
        parts.push(entry.path.clone());
    }

    parts.join(" ")
}

// ── App entry ──────────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            list_ports,
            flash,
            read_flash,
            erase_flash,
            chip_info,
            build_flash_cmd,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
