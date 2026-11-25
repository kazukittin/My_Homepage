#requires -Version 5.1
<#
  いつもちゃんねる スレ監視・自動保存スクリプト

  config.json の threads に登録したスレをチェックし、新しいレスに付いた
  画像・動画ファイルを saveDir に自動保存します。外部リンクは links.txt に記録します。
  初回実行時は、その時点の最新レスまでを既読として監視を開始します（過去分は保存しません）。
  過去分も含めて保存したい場合は -DownloadAll を付けて実行してください。

  使い方: powershell -ExecutionPolicy Bypass -File .\thread-saver.ps1 [-DownloadAll] [-DryRun]
#>
param(
  [switch]$DownloadAll,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
try {
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
} catch {
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ConfigPath = Join-Path $ScriptDir 'config.json'
$StatePath = Join-Path $ScriptDir 'state.json'
$LogPath = Join-Path $ScriptDir 'saver.log'
$UserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
$Referer = 'https://e.5chan.jp/'

function Write-Log([string]$Message) {
  $line = '{0} {1}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message
  Write-Host $line
  if (-not $DryRun) {
    Add-Content -LiteralPath $LogPath -Value $line -Encoding UTF8
  }
}

function Get-PageText([string]$Url) {
  $response = Invoke-WebRequest -Uri $Url -Headers @{ 'Referer' = $Referer } -UserAgent $UserAgent -UseBasicParsing -TimeoutSec 60
  return "$($response.Content)"
}

function Save-RemoteFile([string]$Url, [string]$Destination) {
  Invoke-WebRequest -Uri $Url -Headers @{ 'Referer' = $Referer } -UserAgent $UserAgent -UseBasicParsing -TimeoutSec 600 -OutFile $Destination
}

function Get-ThreadCode([string]$Url) {
  $text = "$Url".Trim()
  if ($text -and $text -notmatch '^[a-z][a-z0-9+.-]*://') {
    $text = "https://$text"
  }
  try {
    $uri = [Uri]$text
  } catch {
    return ''
  }
  if ($uri.Host -notmatch '(^|\.)5chan\.jp$') {
    return ''
  }
  $segment = ($uri.AbsolutePath -split '/')[1]
  if ($segment -match '^[A-Za-z0-9_-]+$') {
    return $segment
  }
  return ''
}

function Get-PostKinds([string]$ArticleHtml, [string]$Code) {
  $attachments = @()
  foreach ($anchor in [regex]::Matches($ArticleHtml, '(?s)<a href="/disp/([A-Za-z0-9_]+)"[^>]*>(.*?)</a>')) {
    $infoMatch = [regex]::Match($anchor.Groups[2].Value, '<span class="info">([^<]+)</span>')
    if (-not $infoMatch.Success) {
      continue
    }
    $kindMatch = [regex]::Match($infoMatch.Groups[1].Value, '^([A-Za-z0-9]+)(画像|動画)')
    if (-not $kindMatch.Success) {
      continue
    }
    $attachments += [pscustomobject]@{
      Id  = $anchor.Groups[1].Value
      Ext = $kindMatch.Groups[1].Value.ToLower()
      Kind = $kindMatch.Groups[2].Value
    }
  }

  $links = @()
  $commentMatch = [regex]::Match($ArticleHtml, '(?s)<div itemprop="text" class="comment">(.*?)</div>')
  if ($commentMatch.Success) {
    foreach ($link in [regex]::Matches($commentMatch.Groups[1].Value, '<a [^>]*href="([^"]+)"')) {
      $href = $link.Groups[1].Value
      if ($href -match '^https?://' -and $href -notmatch "/$Code/\d+/?$") {
        $links += $href
      }
    }
  }

  return [pscustomobject]@{ Attachments = $attachments; Links = $links }
}

function Get-FileUrl($Attachment) {
  if ($Attachment.Kind -eq '画像') {
    return 'https://cdne.5chan.jp/file/plane/{0}.{1}' -f $Attachment.Id, $Attachment.Ext
  }
  return 'https://cdne.5chan.jp/file/{0}.{1}' -f $Attachment.Id, $Attachment.Ext
}

function Get-FallbackFileUrl([string]$DispId) {
  $html = Get-PageText "https://e.5chan.jp/disp/$DispId"
  $match = [regex]::Match($html, '(?:src|href)="(//cdne\.5chan\.jp/file/[^"]+)"')
  if ($match.Success) {
    return 'https:' + $match.Groups[1].Value
  }
  return ''
}

# ---- 設定と状態の読み込み ----
if (-not (Test-Path -LiteralPath $ConfigPath)) {
  Write-Log "config.json がありません。config.example.json をコピーして編集してください。"
  exit 1
}
$config = Get-Content -LiteralPath $ConfigPath -Raw -Encoding UTF8 | ConvertFrom-Json
$saveDir = [Environment]::ExpandEnvironmentVariables("$($config.saveDir)")
if (-not $saveDir) {
  Write-Log "config.json の saveDir が空です。"
  exit 1
}
$threadUrls = @($config.threads)
if (-not $threadUrls.Count) {
  Write-Log "config.json の threads が空です。"
  exit 1
}

$state = [pscustomobject]@{ threads = [pscustomobject]@{} }
if (Test-Path -LiteralPath $StatePath) {
  try {
    $loaded = Get-Content -LiteralPath $StatePath -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($loaded.threads) {
      $state = $loaded
    }
  } catch {
    Write-Log "state.json が壊れていたため作り直します: $($_.Exception.Message)"
  }
}

foreach ($threadUrl in $threadUrls) {
  $code = Get-ThreadCode "$threadUrl"
  if (-not $code) {
    Write-Log "URLを解釈できませんでした: $threadUrl"
    continue
  }
  $baseUrl = "https://e.5chan.jp/$code"

  try {
    $html = Get-PageText "$baseUrl/all"
  } catch {
    Write-Log "[$code] スレを取得できませんでした: $($_.Exception.Message)"
    continue
  }

  $titleMatch = [regex]::Match($html, '<title>(.*?)</title>')
  $title = ''
  if ($titleMatch.Success) {
    $title = ($titleMatch.Groups[1].Value -split '\|')[0].Trim()
  }

  $posts = @()
  foreach ($article in [regex]::Matches($html, '(?s)<article class="resentry">(.*?)</article>')) {
    $enoMatch = [regex]::Match($article.Groups[1].Value, '<span class="eno"><a[^>]*>(\d+)</a>')
    if (-not $enoMatch.Success) {
      continue
    }
    $parsed = Get-PostKinds $article.Groups[1].Value $code
    $posts += [pscustomobject]@{
      No = [int]$enoMatch.Groups[1].Value
      Attachments = $parsed.Attachments
      Links = $parsed.Links
    }
  }
  if (-not $posts.Count) {
    Write-Log "[$code] レスが見つかりませんでした。"
    continue
  }
  $maxNo = ($posts | Measure-Object -Property No -Maximum).Maximum

  $entry = $state.threads.$code
  $isNewThread = ($null -eq $entry)
  if ($isNewThread) {
    $entry = [pscustomobject]@{
      title = $title
      lastSeen = 0
      saved = @()
      pendingFiles = @()
    }
    $state.threads | Add-Member -NotePropertyName $code -NotePropertyValue $entry
    if (-not $DownloadAll) {
      $entry.lastSeen = $maxNo
      Write-Log "[$code] 監視を開始しました（$title / 全$maxNo 件）。過去分は保存しません。"
      continue
    }
  }
  $entry.title = $title

  $threadDir = Join-Path $saveDir $code
  $savedSet = @{}
  foreach ($savedId in @($entry.saved)) {
    $savedSet["$savedId"] = $true
  }

  # 前回失敗したファイルの再試行
  $retryQueue = @($entry.pendingFiles)
  $entry.pendingFiles = @()

  $targets = @()
  foreach ($item in $retryQueue) {
    $targets += [pscustomobject]@{
      No = [int]$item.no
      Attachments = @([pscustomobject]@{ Id = "$($item.id)"; Ext = "$($item.ext)"; Kind = "$($item.kind)" })
      Links = @()
    }
  }
  $targets += @($posts | Where-Object { $_.No -gt $entry.lastSeen })

  $downloaded = 0
  foreach ($post in $targets) {
    foreach ($attachment in @($post.Attachments)) {
      if ($savedSet.ContainsKey($attachment.Id)) {
        continue
      }
      $fileName = '{0:D4}_{1}.{2}' -f $post.No, $attachment.Id, $attachment.Ext
      $destination = Join-Path $threadDir $fileName
      if ($DryRun) {
        Write-Log "[$code] (DryRun) 保存予定: $fileName"
        $downloaded++
        continue
      }
      if (-not (Test-Path -LiteralPath $threadDir)) {
        New-Item -ItemType Directory -Path $threadDir -Force | Out-Null
      }
      $savedOk = $false
      try {
        Save-RemoteFile (Get-FileUrl $attachment) $destination
        $savedOk = (Test-Path -LiteralPath $destination) -and (Get-Item -LiteralPath $destination).Length -gt 0
      } catch {
        $savedOk = $false
      }
      if (-not $savedOk) {
        try {
          $fallback = Get-FallbackFileUrl $attachment.Id
          if ($fallback -and $fallback -ne (Get-FileUrl $attachment)) {
            Save-RemoteFile $fallback $destination
            $savedOk = (Test-Path -LiteralPath $destination) -and (Get-Item -LiteralPath $destination).Length -gt 0
          }
        } catch {
          $savedOk = $false
        }
      }
      if ($savedOk) {
        $savedSet[$attachment.Id] = $true
        $entry.saved = @($entry.saved) + $attachment.Id
        $downloaded++
        Write-Log "[$code] 保存しました: $fileName"
      } elseif (Test-Path -LiteralPath $destination) {
        Remove-Item -LiteralPath $destination -Force
      }
    }

    foreach ($link in @($post.Links)) {
      if ($DryRun) {
        Write-Log "[$code] (DryRun) リンク記録予定: No.$($post.No) $link"
        continue
      }
      if (-not (Test-Path -LiteralPath $threadDir)) {
        New-Item -ItemType Directory -Path $threadDir -Force | Out-Null
      }
      $linksPath = Join-Path $threadDir 'links.txt'
      Add-Content -LiteralPath $linksPath -Value ('{0} No.{1} {2}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm'), $post.No, $link) -Encoding UTF8
      Write-Log "[$code] リンクを記録しました: No.$($post.No) $link"
    }
  }

  # 失敗した添付は次回再試行する
  if (-not $DryRun) {
    foreach ($post in $targets) {
      foreach ($attachment in @($post.Attachments)) {
        if (-not $savedSet.ContainsKey($attachment.Id)) {
          $entry.pendingFiles = @($entry.pendingFiles) + [pscustomobject]@{
            no = $post.No
            id = $attachment.Id
            ext = $attachment.Ext
            kind = $attachment.Kind
          }
          Write-Log "[$code] 保存に失敗したため次回再試行します: No.$($post.No) $($attachment.Id)"
        }
      }
    }
  }

  $entry.lastSeen = [Math]::Max([int]$entry.lastSeen, [int]$maxNo)
  if ($downloaded -gt 0 -and -not $DryRun) {
    Write-Log "[$code] $downloaded 件保存しました（全$maxNo 件）。"
  } elseif (-not $isNewThread) {
    Write-Log "[$code] 新着の画像・動画はありませんでした（全$maxNo 件）。"
  }
}

if (-not $DryRun) {
  $state | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $StatePath -Encoding UTF8
}
