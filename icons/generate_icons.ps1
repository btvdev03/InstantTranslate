Add-Type -AssemblyName System.Drawing

function Generate-Icon {
    param (
        [int]$size,
        [string]$outputPath
    )

    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    # Clear transparent
    $g.Clear([System.Drawing.Color]::Transparent)

    # Rounded rectangle path
    $corner = [Math]::Max(3, [int]($size * 0.22))
    $rect = New-Object System.Drawing.Rectangle 1, 1, ($size - 2), ($size - 2)
    
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $diameter = $corner * 2
    $path.AddArc($rect.X, $rect.Y, $diameter, $diameter, 180, 90)
    $path.AddArc($rect.Right - $diameter, $rect.Y, $diameter, $diameter, 270, 90)
    $path.AddArc($rect.Right - $diameter, $rect.Bottom - $diameter, $diameter, $diameter, 0, 90)
    $path.AddArc($rect.X, $rect.Bottom - $diameter, $diameter, $diameter, 90, 90)
    $path.CloseFigure()

    # Gradient background: Modern Royal Blue to Cyan
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        (New-Object System.Drawing.PointF 0, 0),
        (New-Object System.Drawing.PointF $size, $size),
        [System.Drawing.Color]::FromArgb(255, 79, 70, 229),   # Indigo (#4F46E5)
        [System.Drawing.Color]::FromArgb(255, 14, 165, 233)   # Sky Blue (#0EA5E9)
    )
    $g.FillPath($brush, $path)

    # Subtle inner border
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(80, 255, 255, 255), 1.5)
    $g.DrawPath($pen, $path)

    if ($size -ge 48) {
        # Draw "A" and "文"
        $fontFamilyA = New-Object System.Drawing.FontFamily("Segoe UI")
        $fontFamilyB = New-Object System.Drawing.FontFamily("Microsoft YaHei")
        
        $fontSize = [float]($size * 0.32)
        $fontA = New-Object System.Drawing.Font($fontFamilyA, $fontSize, [System.Drawing.FontStyle]::Bold)
        $fontB = New-Object System.Drawing.Font($fontFamilyB, [float]($fontSize * 0.88), [System.Drawing.FontStyle]::Bold)

        $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
        $accentBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 224, 242, 254))

        # Position "A" on upper left
        $formatLeft = New-Object System.Drawing.StringFormat
        $formatLeft.Alignment = [System.Drawing.StringAlignment]::Center
        $formatLeft.LineAlignment = [System.Drawing.StringAlignment]::Center

        $rectA = New-Object System.Drawing.RectangleF ([float]($size * 0.12)), ([float]($size * 0.22)), ([float]($size * 0.45)), ([float]($size * 0.45))
        $g.DrawString("A", $fontA, $textBrush, $rectA, $formatLeft)

        # Position "文" on lower right
        $rectB = New-Object System.Drawing.RectangleF ([float]($size * 0.46)), ([float]($size * 0.38)), ([float]($size * 0.45)), ([float]($size * 0.45))
        $g.DrawString([char]0x6587, $fontB, $accentBrush, $rectB, $formatLeft)

        # Small translation swap arrow or dot between them
        $penArrow = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(200, 255, 255, 255), [float]($size * 0.035))
        $penArrow.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
        $penArrow.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
        $g.DrawLine($penArrow, [float]($size * 0.36), [float]($size * 0.72), [float]($size * 0.64), [float]($size * 0.72))
    } else {
        # For 16x16: Crisp bold "A" or symbol
        $font = New-Object System.Drawing.Font("Arial", 8.5, [System.Drawing.FontStyle]::Bold)
        $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
        $sf = New-Object System.Drawing.StringFormat
        $sf.Alignment = [System.Drawing.StringAlignment]::Center
        $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
        $g.DrawString("A", $font, $textBrush, (New-Object System.Drawing.RectangleF 0, 0, 16, 16), $sf)
    }

    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Generated: $outputPath ($size x $size)"
}

Generate-Icon 16 "C:\Dev\tools\InstantTranslate\icons\icon16.png"
Generate-Icon 48 "C:\Dev\tools\InstantTranslate\icons\icon48.png"
Generate-Icon 128 "C:\Dev\tools\InstantTranslate\icons\icon128.png"
