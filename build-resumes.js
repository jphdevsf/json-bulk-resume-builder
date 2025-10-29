const fs = require('fs')
const path = require('path')
const puppeteer = require('puppeteer')
const { spawn } = require('child_process')

const packageJson = require('./package.json')
const themes = Object.keys(packageJson.devDependencies)
  .filter(dep => dep.startsWith('jsonresume-theme-'))
  .map(theme => theme.replace('jsonresume-theme-', ''))

const outputDir = path.join(__dirname, 'output')
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir)

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function generateHtmlContent(theme, jsonPath) {
  return new Promise((resolve, reject) => {
    const baseName = path.basename(jsonPath, '.json')
    const tempHtmlFile = `${baseName}.html`

    if (fs.existsSync(tempHtmlFile)) fs.unlinkSync(tempHtmlFile)

    const resumed = spawn('npx', ['resumed', 'render', jsonPath, '-t', `jsonresume-theme-${theme}`])

    resumed.stderr.on('data', data => console.error(`Error with theme ${theme}:`, data.toString()))

    resumed.on('close', code => {
      if (code !== 0) return reject(new Error(`resumed process exited with code ${code}`))
      if (!fs.existsSync(tempHtmlFile)) return reject(new Error(`${tempHtmlFile} was not generated`))
      try {
        const html = fs.readFileSync(tempHtmlFile, 'utf8')
        fs.unlinkSync(tempHtmlFile)
        resolve(html)
      } catch (err) {
        reject(err)
      }
    })
  })
}

async function generatePdf(html, outputPath, browser) {
  const ownBrowser = !browser
  const browserInstance = browser || await puppeteer.launch()
  const page = await browserInstance.newPage()
  await page.setContent(html)
  await page.pdf({
    path: outputPath,
    format: 'A4',
    margin: {
      top: '20mm',
      right: '20mm',
      bottom: '20mm',
      left: '20mm'
    }
  })
  await page.close()
  if (ownBrowser) await browserInstance.close()
}

function getJsonFiles() {
  const srcDir = path.join(__dirname, 'src')
  if (!fs.existsSync(srcDir)) {
    throw new Error('src/ directory does not exist')
  }

  return fs.readdirSync(srcDir)
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(srcDir, file))
}

async function buildAllResumes() {
  console.log('Building resumes for themes:', themes)

  const jsonFiles = getJsonFiles()
  console.log('Processing JSON files:', jsonFiles.map(f => path.basename(f)))

  // Phase 1: Build all HTML files and write them to output; do not create PDFs yet
  const createdHtmlFiles = []
  for (const jsonFile of jsonFiles) {
    const baseName = path.basename(jsonFile, '.json')
    console.log(`\nProcessing JSON file: ${baseName}`)

    const resumeDir = path.join(outputDir, baseName)
    if (!fs.existsSync(resumeDir)) {
      fs.mkdirSync(resumeDir, { recursive: true })
    }

    for (const theme of themes) {
      try {
        console.log(`  Generating HTML with theme: ${theme}`)
        const html = await generateHtmlContent(theme, jsonFile)
        const outputHtmlPath = path.join(resumeDir, `${baseName}-${theme}.html`)
        fs.writeFileSync(outputHtmlPath, html)
        createdHtmlFiles.push(outputHtmlPath)
        console.log(`  Created HTML resume: ${outputHtmlPath}`)
      } catch (error) {
        console.error(`  Failed to render theme ${theme} for ${baseName}:`, error)
      }
    }
  }

  if (createdHtmlFiles.length) {
    console.log('\nCreated HTML resumes:')
    for (const f of createdHtmlFiles) console.log(`  ${f}`)
  } else {
    console.log('\nNo HTML resumes were created.')
  }

  await delay(250)

  const createdPdfFiles = []
  if (createdHtmlFiles.length) {
    const browser = await puppeteer.launch()
    try {
      for (const htmlPath of createdHtmlFiles) {
        const pdfPath = htmlPath.replace(/\.html$/i, '.pdf')
        try {
          const html = fs.readFileSync(htmlPath, 'utf8')
          await generatePdf(html, pdfPath, browser)
          createdPdfFiles.push(pdfPath)
        } catch (err) {
          console.error(`  Failed to create PDF for ${htmlPath}:`, err)
        }
      }
    } finally {
      await browser.close()
    }
  }

  if (createdPdfFiles.length) {
    console.log('\nCreated PDF resumes:')
    for (const f of createdPdfFiles) console.log(`  ${f}`)
  } else {
    console.log('\nNo PDF resumes were created.')
  }

  console.log('\nAll resumes have been generated!')
}

buildAllResumes().catch(console.error)
