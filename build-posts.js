import fs from 'fs-extra';
import path from 'path';
import nunjucks from 'nunjucks';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

const orgFilesDir = path.join(process.env.HOME, 'Orgfiles', 'roam');
const outputDir = './posts';
const trackedReferencesFile = './_data/trackedReferences.json';

nunjucks.configure({ autoescape: true });

async function loadTrackedReferences() {
    console.log('Loading tracked references...');
    try {
        const data = await fs.readFile(trackedReferencesFile, 'utf-8');
        console.log('Tracked references loaded successfully.');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading tracked references:', error);
        throw error;
    }
}

async function getFilesWithPublishFlag() {
    console.log('Reading files from org files directory...');
    try {
        const files = await fs.readdir(orgFilesDir);
        console.log('Files read successfully.');
        return files.filter(file => file.endsWith('.org') && /^[a-z0-9]/i.test(file));
    } catch (error) {
        console.error('Error reading files:', error);
        throw error;
    }
}

function extractVariable(content, variable) {
    const regex = new RegExp(`:${variable}:\\s*(.+)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : null;
}

async function processFile(file, trackedReferences) {
    console.log(`Processing file: ${file}`);
    try {
        const content = await fs.readFile(path.join(orgFilesDir, file), 'utf-8');
        const trackerPublish = extractVariable(content, 'TRACKER_PUBLISHED');
        const blogPublish = extractVariable(content, 'BLOG_PUBLISHED');

        if (trackerPublish === 'YES') {
            console.log('TRACKER_PUBLISHED flag found.');
            const citekey = path.basename(file, '.org');
            const reference = trackedReferences.find(ref => ref.citekey === citekey);
            if (reference) {
                const title = `Notes on ${reference.title}`;
                const frontmatter = {
                    layout: 'post',
                    tags: '\n- BookTracker',
                    title: `"${title}"`,
                };
                await generateHtml(file, content, frontmatter);
            } else {
                console.log(`Reference not found for citekey: ${citekey}`);
            }
        } else if (blogPublish === 'YES') {
            console.log('BLOG_PUBLISHED flag found.');
            const title = extractVariable(content, 'TITLE');
            const image = extractVariable(content, 'IMAGE');
            const tags = extractVariable(content, 'TAGS');
            const frontmatter = {
                title,
                image,
                tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            };
            await generateHtml(file, content, frontmatter);
        } else {
            console.log('No publish flags found.');
        }
    } catch (error) {
        console.error(`Error processing file ${file}:`, error);
        throw error;
    }
}

async function generateHtml(filename, content, frontmatter) {
    console.log(`Generating HTML for file: ${filename}`);
    try {
        const orgFilePath = path.join(orgFilesDir, filename);
        const { stdout, stderr } = await execPromise(`pandoc ${orgFilePath} -f org -t html`);
        if (stderr) {
            throw new Error(stderr);
        }
        const htmlContent = stdout;

        const frontmatterString = `---
${Object.entries(frontmatter).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('\n')}
---

${htmlContent}`;

        const outputFilePath = path.join(outputDir, `${path.basename(filename, '.org')}.html`);
        await fs.outputFile(outputFilePath, frontmatterString);
        console.log(`HTML generated and saved to ${outputFilePath}`);
    } catch (error) {
        console.error(`Error generating HTML for file ${filename}:`, error);
        throw error;
    }
}

(async function main() {
    console.log('Starting script...');
    try {
        await fs.ensureDir(outputDir);
        const trackedReferences = await loadTrackedReferences();
        const files = await getFilesWithPublishFlag();

        for (const file of files) {
            await processFile(file, trackedReferences);
        }

        console.log('Finished processing files.');
    } catch (error) {
        console.error('Error in main function:', error);
    }
})();
