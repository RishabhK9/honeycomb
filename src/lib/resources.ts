import fs from "fs";
import path from "path";

type Metadata = {
    title: string;
    date: string;
    excerpt: string;
    coverImage: string;
    ogImage: string;
};

function parseFrontmatter(fileContent: string) {
    let frontmatterRegex = /---\s*([\s\S]*?)\s*---/;
    let match = frontmatterRegex.exec(fileContent);
    let frontMatterBlock = match![1];
    let content = fileContent.replace(frontmatterRegex, "").trim();
    let frontMatterLines = frontMatterBlock.trim().split("\n");
    let metadata: Partial<Metadata> = {};

    frontMatterLines.forEach((line) => {
        let [key, ...valueArr] = line.split(": ");
        let value = valueArr.join(": ").trim();
        value = value.replace(/^['"](.*)['"]$/, "$1"); // Remove quotes
        metadata[key.trim() as keyof Metadata] = value;
    });

    return { metadata: metadata as Metadata, content };
}

function getMDXFiles(dir: string) {
    return fs.readdirSync(dir).filter((file) => path.extname(file) === ".mdx");
}

function readMDXFile(filePath: string) {
    let rawContent = fs.readFileSync(filePath, "utf-8");
    return parseFrontmatter(rawContent);
}

interface Post {
    metadata: Metadata;
    slug: string;
    content: string;
}

function getMDXData(dir: string): Post[] {
    let mdxFiles = getMDXFiles(dir);
    let posts = mdxFiles.map((file) => {
        let { metadata, content } = readMDXFile(path.join(dir, file));
        let slug = path.basename(file, path.extname(file));
        return {
            metadata,
            slug,
            content,
        };
    });
    return posts;
}

export function getPosts() {
    let posts = getMDXData(path.join(process.cwd(), "src", "app", "resources", "posts"));
    return posts.sort((a, b) => new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime());
}

export function formatDate(date: string, includeRelative = false) {
    let currentDate = new Date();
    if (!date.includes("T")) {
        date = `${date}T00:00:00`;
    }
    let targetDate = new Date(date);

    let yearsAgo = currentDate.getFullYear() - targetDate.getFullYear();
    let monthsAgo = currentDate.getMonth() - targetDate.getMonth();
    let daysAgo = currentDate.getDate() - targetDate.getDate();

    let formattedDate = "";

    if (yearsAgo > 0) {
        formattedDate = `${yearsAgo}y ago`;
    } else if (monthsAgo > 0) {
        formattedDate = `${monthsAgo}mo ago`;
    } else if (daysAgo > 0) {
        formattedDate = `${daysAgo}d ago`;
    } else {
        formattedDate = "Today";
    }

    let fullDate = targetDate.toLocaleString("en-us", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });

    if (!includeRelative) {
        return fullDate;
    }

    return `${fullDate} (${formattedDate})`;
}
