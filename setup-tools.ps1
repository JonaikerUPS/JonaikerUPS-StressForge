# Script para instalar herramientas necesarias localmente en Windows

Write-Host "Iniciando instalación de herramientas..."

# Verificar Node.js
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js no está instalado. Por favor, instálalo desde https://nodejs.org/"
    return
}

# Instalar herramientas de Node
Write-Host "Instalando artillery, hey, autocannon..."
npm install -g artillery hey autocannon

# Verificar Python
if (Get-Command pip -ErrorAction SilentlyContinue) {
    Write-Host "Instalando locust, bzt (Taurus)..."
    pip install locust bzt
} else {
    Write-Warning "pip no encontrado. Por favor, instala Python y pip para locust y taurus."
}

Write-Host "Instalación de herramientas basada en Node/Python finalizada."
Write-Host "Nota: k6 y JMeter requieren instalación manual o mediante chocolatey (choco install k6 jmeter)."
