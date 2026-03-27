import { marked } from "marked";
import fs from "fs";
import path from "path";

/**
 * Reads a markdown file from the content directory and returns the HTML string.
 * @param filename - The name of the file (without extension if it's .md)
 */
export async function getMarkdownContent(filename: string): Promise<string> {
    const filePath = path.join(process.cwd(), "content", `${filename.replace(/\.md$/, "")}.md`);
    
    if (!fs.existsSync(filePath)) {
        console.error(`Markdown file not found: ${filePath}`);
        return "";
    }

    try {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        // Convert markdown to HTML
        const htmlContent = marked.parse(fileContent);
        return htmlContent as string;
    } catch (error) {
        console.error(`Error reading markdown file ${filename}:`, error);
        return "";
    }
}
