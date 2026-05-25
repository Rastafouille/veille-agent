param(
  [string]$OutPath = "veille-recap-2026-05-25.png"
)

Add-Type -AssemblyName System.Drawing

$width = 1400
$height = 2200
$bitmap = New-Object System.Drawing.Bitmap $width, $height
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

function New-Brush([string]$hex) {
  return New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml($hex))
}

function Fill-RoundRect([float]$x, [float]$y, [float]$w, [float]$h, [float]$r, [string]$color) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $path.AddArc($x, $y, $d, $d, 180, 90)
  $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  $graphics.FillPath((New-Brush $color), $path)
}

function Draw-Text([string]$text, [float]$x, [float]$y, [float]$w, [float]$h, [float]$size, [string]$color, [string]$style = "Regular") {
  $fontStyle = [System.Drawing.FontStyle]::$style
  $font = New-Object System.Drawing.Font("Segoe UI", $size, $fontStyle, [System.Drawing.GraphicsUnit]::Pixel)
  $format = New-Object System.Drawing.StringFormat
  $format.Trimming = [System.Drawing.StringTrimming]::EllipsisWord
  $rect = New-Object System.Drawing.RectangleF($x, $y, $w, $h)
  $graphics.DrawString($text, $font, (New-Brush $color), $rect, $format)
}

function Draw-Pill([string]$text, [float]$x, [float]$y, [string]$color) {
  Fill-RoundRect $x $y 170 34 10 $color
  Draw-Text $text ($x + 15) ($y + 7) 140 22 16 "#ffffff" "Bold"
}

$graphics.Clear([System.Drawing.ColorTranslator]::FromHtml("#f4f7fb"))

Fill-RoundRect 70 60 1260 250 26 "#003b95"
Draw-Text "Veille scientifique collaborative" 110 95 720 36 24 "#d8e8ff" "Bold"
Draw-Text "Recap visuel du run Supabase" 110 135 900 62 48 "#ffffff" "Bold"
Draw-Text "25 mai 2026 - fenetre glissante 6 mois - Rastafouille/veille-agent" 110 205 980 34 23 "#d8e8ff"
Fill-RoundRect 1060 92 210 120 18 "#ffffff"
Draw-Text "SUCCESS" 1095 115 150 26 22 "#067236" "Bold"
Draw-Text "REST OK" 1095 150 150 28 28 "#003b95" "Bold"
Draw-Text "MCP absent" 1095 184 150 22 17 "#64748b"

$cardY = 350
$cards = @(
  @("2", "nouveaux articles", "#eaf3ff", "#003b95"),
  @("6", "deja presents", "#effaf3", "#067236"),
  @("5", "onglets traites", "#fff7e6", "#a45f00")
)
$x = 70
foreach ($card in $cards) {
  Fill-RoundRect $x $cardY 390 150 18 $card[2]
  Draw-Text $card[0] ($x + 30) ($cardY + 28) 120 60 56 $card[3] "Bold"
  Draw-Text $card[1] ($x + 30) ($cardY + 92) 260 34 24 "#334155" "Bold"
  $x += 435
}

Fill-RoundRect 70 550 1260 205 18 "#ffffff"
Draw-Text "Ce qui a change" 110 585 600 36 30 "#172033" "Bold"
Draw-Text "Supabase a ete rattrape via REST. Deux articles industrie ont ete ajoutes pour Jerem avec rating=5. Les autres candidats etaient deja presents dans la base." 110 635 1120 78 25 "#4d5b73"
Draw-Text "Commit main: 4a12460 - Prochaine veille: 1 juin 2026" 110 715 1000 28 21 "#64748b"

Draw-Text "Articles ajoutes" 70 810 500 44 36 "#172033" "Bold"

Fill-RoundRect 70 875 600 310 18 "#ffffff"
Draw-Pill "Jerem - presse" 105 910 "#003b95"
Draw-Text "Off-the-shelf tech and reduced costs" 105 962 510 82 28 "#172033" "Bold"
Draw-Text "Signal RAICo/NDA sur les technologies commerciales et robots quadrupedes pour reduire couts et risques en demantelement." 105 1058 505 92 21 "#4d5b73"

Fill-RoundRect 730 875 600 310 18 "#ffffff"
Draw-Pill "Jerem - presse" 765 910 "#003b95"
Draw-Text "Dismantling of reactor channels to begin at second Ignalina unit" 765 962 510 96 27 "#172033" "Bold"
Draw-Text "Signal industriel sur Ignalina: commande a distance et technologies robotisees pour les etapes radiologiques sensibles." 765 1072 505 78 21 "#4d5b73"

Draw-Text "Synthese par onglet" 70 1250 500 44 36 "#172033" "Bold"
$tabs = @(
  @("Jerem", "2 ajoutes", "Notes terrain fortes: MDPI quadrupede 10, RAICo 9, Sellafield 9, Fukushima 7.", "#003b95"),
  @("Nathan", "0 nouveau", "Resultats beta deja presents: Physics Open, Sr-90, deep learning beta, ERG 102F.", "#0f766e"),
  @("Pierre-Louis", "0 nouveau", "SINAPSE, Self2Self et methodes bayesiennes/spectral unmixing deja en base.", "#7c3aed"),
  @("Lucas", "0 nouveau", "Khronos 3DGS, GaussTwin et digital twin Unity-ROS2-MoveIt deja presents.", "#c2410c"),
  @("Thibaud D", "0 nouveau", "PolyMap 9, LoS polygonal regions 6, Visual localization mesh/NeRF 3.", "#334155")
)
$y = 1320
foreach ($tab in $tabs) {
  Fill-RoundRect 70 $y 1260 90 15 "#ffffff"
  Fill-RoundRect 92 ($y + 22) 8 46 4 $tab[3]
  Draw-Text $tab[0] 120 ($y + 18) 220 30 25 "#172033" "Bold"
  Draw-Text $tab[1] 350 ($y + 18) 170 30 22 $tab[3] "Bold"
  Draw-Text $tab[2] 120 ($y + 50) 1120 28 20 "#4d5b73"
  $y += 104
}

Fill-RoundRect 70 1880 1260 170 20 "#ffffff"
Draw-Text "Resultats deja presents" 110 1910 500 34 30 "#172033" "Bold"
Draw-Text "SINAPSE, GaussTwin, High-Fidelity Digital Twin 3DGS, Line-of-Sight Polygonal Visible Regions, Visual localization mesh/NeRF et les principaux resultats beta Nathan etaient deja dans Supabase." 110 1960 1120 62 22 "#4d5b73"

Fill-RoundRect 70 2080 1260 70 16 "#003b95"
Draw-Text "Dashboard: https://rastafouille.github.io/veille-agent/" 110 2101 1000 34 25 "#ffffff" "Bold"

$bitmap.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()

Get-Item $OutPath
