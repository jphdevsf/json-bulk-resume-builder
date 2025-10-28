# JSON Bulk Resume Builder

This repository contains tools and scripts to generate resumes in multiple formats using the JSON Resume standard. It automatically generates both HTML and PDF versions for all installed themes.

## Prerequisites

- Node.js and npm installed
- A valid `resume.json` file in the root directory (following [JSON Resume Schema](https://jsonresume.org/schema/))

## Installation

```bash
# Clone the repository
git clone [repository-url]
cd resume

# Install dependencies
npm install
```

## Usage

### Building All Resumes

```bash
npm run build
```

This command:
1. Scans `package.json` for all packages prefixed with "jsonresume-theme-"
2. Creates an `output` directory
3. For each theme:
   - Generates an HTML version
   - Converts the HTML to PDF using Puppeteer
4. Saves files as `resume-[theme].html` and `resume-[theme].pdf`

### Manual Resume Generation

You can also generate resumes manually using the `resumed` CLI:

```bash
# Generate HTML version
npx resumed render --theme=jsonresume-theme-stackoverflow

# Generate PDF version
npx resumed export --theme=jsonresume-theme-stackoverflow resume.pdf
```

## Adding New Themes

To install additional themes:

```bash
npm install --save-dev jsonresume-theme-[theme-name]
```

For example:
```bash
npm install --save-dev jsonresume-theme-elegant
```

Currently installed themes:
- even
- flat
- kendall
- onepage-plus
- paper
- relaxed
- rickosborne
- rocketspacer
- simplyelegant
- stackoverflow

## Project Structure

```
├── resume.json          # Your resume data
├── build-resumes.js    # Build script for all themes
├── package.json        # Project dependencies
└── output/            # Generated resumes
    ├── resume-[theme].html
    └── resume-[theme].pdf
```

## Privacy

The `.gitignore` is configured to exclude `_resume.json`, allowing you to keep a private version of your resume separate from the public repository.

## Contributing

Feel free to submit issues and enhancement requests!

## License

ISC