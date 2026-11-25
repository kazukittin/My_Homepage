#requires -Version 5.1
<#
  いつもちゃんねる スレ監視・自動保存 セットアップ

  - config.json がなければ config.example.json から作成します（編集は手動で行ってください）
  - タスクスケジューラに「ItsumoThreadSaver」を登録し、5分おきに thread-saver.ps1 を実行します

  使い方: PowerShellで このフォルダを開き、次を実行
    powershell -ExecutionPolicy Bypass -File .\setup.ps1

  解除したいとき:
    Unregister-ScheduledTask -TaskName 'ItsumoThreadSaver' -Confirm:$false
#>

$ErrorActionPreference = 'Stop'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SaverPath = Join-Path $ScriptDir 'thread-saver.ps1'
$ConfigPath = Join-Path $ScriptDir 'config.json'
$ExamplePath = Join-Path $ScriptDir 'config.example.json'
$TaskName = 'ItsumoThreadSaver'

if (-not (Test-Path -LiteralPath $ConfigPath)) {
  Copy-Item -LiteralPath $ExamplePath -Destination $ConfigPath
  Write-Host "config.json を作成しました。threads と saveDir を編集してから、もう一度 setup.ps1 を実行してください。"
  Write-Host "編集するファイル: $ConfigPath"
  notepad $ConfigPath
  exit 0
}

$config = Get-Content -LiteralPath $ConfigPath -Raw -Encoding UTF8 | ConvertFrom-Json
if (-not @($config.threads).Count -or "$($config.threads[0])" -like '*ここに*') {
  Write-Host "config.json の threads に監視したいスレのURLを設定してから、もう一度実行してください。"
  notepad $ConfigPath
  exit 1
}

$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument ('-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "{0}"' -f $SaverPath)
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 5) -RepetitionDuration (New-TimeSpan -Days 3650)
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 10)

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Description 'いつもちゃんねるの監視スレに付いた画像・動画を自動保存する' -Force | Out-Null

Write-Host "登録しました: タスク '$TaskName' が5分おきに thread-saver.ps1 を実行します。"
Write-Host "まず動作を見たい場合は、次を手動で実行してください（初回は監視開始のみで、過去分は保存しません）:"
Write-Host "  powershell -ExecutionPolicy Bypass -File `"$SaverPath`""
Write-Host "過去分も含めて保存したい場合は -DownloadAll を付けてください。"
Write-Host "解除: Unregister-ScheduledTask -TaskName '$TaskName' -Confirm:`$false"
