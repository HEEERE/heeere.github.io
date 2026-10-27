param(
  [string]$SdkPath = 'D:\android-sdk',
  [string]$JavaPath = 'D:\java'
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $projectRoot
$buildPath = Join-Path $projectRoot 'android\build'
$toolPath = Join-Path $SdkPath 'build-tools\34.0.0'
$platformJar = Join-Path $SdkPath 'platforms\android-34\android.jar'
$env:JAVA_HOME = $JavaPath
$env:PATH = "$JavaPath\bin;$env:PATH"
function Run-Checked([string]$program, [string[]]$arguments) {
  & $program @arguments
  if ($LASTEXITCODE -ne 0) { throw "$program failed ($LASTEXITCODE)" }
}
Run-Checked 'npm.cmd' @('exec', '--', 'vite', 'build', '--config', 'vite.garden.config.ts', '--logLevel', 'warn')
$assetPath = [System.IO.Path]::GetFullPath((Join-Path $buildPath 'assets'))
$expectedAssets = [System.IO.Path]::GetFullPath((Join-Path $projectRoot 'android\build\assets'))
if ($assetPath -ne $expectedAssets -or !$assetPath.StartsWith($projectRoot + '\')) { throw 'Unexpected generated assets directory' }
if (Test-Path -LiteralPath $assetPath) { Remove-Item -LiteralPath $assetPath -Recurse -Force }
$directories = @('assets\www','res\drawable','gen','classes','dex')
foreach ($dir in $directories) { New-Item -ItemType Directory -Force -Path (Join-Path $buildPath $dir) | Out-Null }
Copy-Item -Path "$buildPath\web\*" -Destination "$buildPath\assets\www" -Recurse -Force
New-Item -ItemType Directory -Force -Path "$buildPath\assets\www\vault\icons" | Out-Null
Copy-Item 'public\vault\icons\*.png' "$buildPath\assets\www\vault\icons" -Force
Copy-Item 'public\vault\icons\icon-192.png' "$buildPath\res\drawable\icon.png" -Force
Run-Checked "$toolPath\aapt.exe" @('package','-f','-M','android\AndroidManifest.xml','-S',"$buildPath\res",'-A',"$buildPath\assets",'-I',$platformJar,'-J',"$buildPath\gen",'-F',"$buildPath\garden-unsigned.apk")
$sources = @(Get-ChildItem 'android\src',"$buildPath\gen" -Filter '*.java' -Recurse | ForEach-Object { $_.FullName })
Run-Checked "$JavaPath\bin\javac.exe" (@('-encoding','UTF-8','-source','8','-target','8','-classpath',$platformJar,'-d',"$buildPath\classes") + $sources)
Run-Checked "$JavaPath\bin\jar.exe" @('cf',"$buildPath\classes.jar",'-C',"$buildPath\classes",'.')
Run-Checked "$toolPath\d8.bat" @('--lib',$platformJar,'--min-api','26','--output',"$buildPath\dex", "$buildPath\classes.jar")
Run-Checked "$JavaPath\bin\jar.exe" @('uf',"$buildPath\garden-unsigned.apk",'-C',"$buildPath\dex",'classes.dex')
Run-Checked "$toolPath\zipalign.exe" @('-f','4',"$buildPath\garden-unsigned.apk", "$buildPath\garden-aligned.apk")
$signingPath = Join-Path $projectRoot 'android\signing'
New-Item -ItemType Directory -Force -Path $signingPath | Out-Null
$keyPath = Join-Path $signingPath 'garden-release.p12'
$passwordPath = Join-Path $signingPath 'password.txt'
if (!(Test-Path -LiteralPath $keyPath)) {
  $randomBytes = New-Object byte[] 32
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  $rng.GetBytes($randomBytes)
  $rng.Dispose()
  [System.IO.File]::WriteAllText($passwordPath, [Convert]::ToBase64String($randomBytes))
  Run-Checked "$JavaPath\bin\keytool.exe" @('-genkeypair','-keystore',$keyPath,'-storetype','PKCS12','-storepass:file',$passwordPath,'-alias','garden','-keyalg','RSA','-keysize','3072','-validity','10000','-dname','CN=Zheyuan Garden, OU=Personal, O=Hakoniwa, C=CN')
}
$outputPath = Join-Path $projectRoot 'deliverables'
New-Item -ItemType Directory -Force -Path $outputPath | Out-Null
$apkPath = Join-Path $outputPath 'Zheyuan-Garden-1.0.1.apk'
Run-Checked "$toolPath\apksigner.bat" @('sign','--ks',$keyPath,'--ks-pass',"file:$passwordPath",'--ks-key-alias','garden','--out',$apkPath,"$buildPath\garden-aligned.apk")
Run-Checked "$toolPath\apksigner.bat" @('verify','--verbose','--print-certs',$apkPath)
$hashAlgorithm = [System.Security.Cryptography.SHA256]::Create()
$hash = [BitConverter]::ToString($hashAlgorithm.ComputeHash([System.IO.File]::ReadAllBytes($apkPath))).Replace('-', '')
$hashAlgorithm.Dispose()
[System.IO.File]::WriteAllText((Join-Path $outputPath 'SHA256.txt'), "$hash  Zheyuan-Garden-1.0.1.apk`n")
Write-Output "APK: $apkPath"
