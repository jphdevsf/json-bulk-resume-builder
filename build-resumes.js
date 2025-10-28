const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { spawn } = require('child_process');

// Get all installed themes from package.json
const packageJson = require('./package.json');
const themes = Object.keys(packageJson.devDependencies)
    .filter(dep => dep.startsWith('jsonresume-theme-'))
    .map(theme => theme.replace('jsonresume-theme-', ''));

// Create output directories if they don't exist
const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// Function to generate HTML for a theme
async function generateHtml(theme) {
    return new Promise((resolve, reject) => {
        // First, remove any existing resume.html file
        if (fs.existsSync('resume.html')) {
            fs.unlinkSync('resume.html');
        }

        const resumed = spawn('npx', ['resumed', 'render', 'resume.json', '-t', `jsonresume-theme-${theme}`]);

        resumed.stderr.on('data', (data) => {
            console.error(`Error with theme ${theme}:`, data.toString());
        });

        resumed.on('close', async (code) => {
            if (code !== 0) {
                reject(new Error(`resumed process exited with code ${code}`));
                return;
            }

            // Wait a bit to ensure the file is written
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Check if resume.html exists
            if (!fs.existsSync('resume.html')) {
                reject(new Error('resume.html was not generated'));
                return;
            }

            // Read the generated HTML file
            const html = fs.readFileSync('resume.html', 'utf8');
            
            // Clean up
            fs.unlinkSync('resume.html');
            
            resolve(html);
        });
    });
}

// Function to convert HTML to PDF
async function generatePdf(html, outputPath) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html);
    await page.pdf({
        path: outputPath,
        format: 'A4',
        margin: {
            top: '20mm',
            right: '20mm',
            bottom: '20mm',
            left: '20mm'
        }
    });
    await browser.close();
}

// Main function to process all themes
async function buildAllResumes() {
    console.log('Building resumes for themes:', themes);

    for (const theme of themes) {
        try {
            console.log(`\nProcessing theme: ${theme}`);
            
            // Generate HTML
            const html = await generateHtml(theme);
            const htmlPath = path.join(outputDir, `resume-${theme}.html`);
            fs.writeFileSync(htmlPath, html);
            console.log(`Created HTML resume: ${htmlPath}`);

            // Generate PDF
            const pdfPath = path.join(outputDir, `resume-${theme}.pdf`);
            await generatePdf(html, pdfPath);
            console.log(`Created PDF resume: ${pdfPath}`);
        } catch (error) {
            console.error(`Failed to process theme ${theme}:`, error);
        }
    }

    console.log('\nAll resumes have been generated!');
}

// Run the script
buildAllResumes().catch(console.error);