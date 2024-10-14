function getGitHubApiUrl(gitHubUrl) {
    console.log('GitHub URL:', gitHubUrl);
    const repoPath = gitHubUrl.replace(/^https:\/\/github.com\//, "");
    return `https://api.github.com/repos/${repoPath}/contents/`;
}

function generatePlantUML(classes) {
    let plantUML = "@startuml\n";
    classes.forEach(cls => {
        plantUML += `class ${cls.name} {\n`;
        cls.methods.forEach(method => {
            plantUML += `  ${method}\n`;
        });
        plantUML += "}\n";
    });
    plantUML += "@enduml";
    return plantUML;
}

async function fetchJavaFiles() {
    document.getElementById('output').innerHTML = '';    
    const gitHubUrl = document.getElementById('repoUrl').value;
    const apiUrl = getGitHubApiUrl(gitHubUrl);
    let classes = [];
    await fetchAndParseFiles(apiUrl, '', classes);
    const plantUML = generatePlantUML(classes);
    document.getElementById('output').innerText = plantUML;
}

async function fetchAndParseFiles(baseUrl, path, classes) {
    const fileListUrl = `${baseUrl}${path}`;

    const response = await fetch(fileListUrl);
    if (!response.ok) {
        console.error('Failed to fetch:', response.statusText);
        return;
    }
    const entries = await response.json();

    for (let entry of entries) {
        if (entry.type === 'file' && entry.name.endsWith('.java')) {
            const fileResponse = await fetch(entry.download_url);
            const fileContent = await fileResponse.text();
            parseJavaFile(entry.path, fileContent, classes);
        } else if (entry.type === 'dir') {
            await fetchAndParseFiles(baseUrl, `${entry.path}/`, classes);
        }
    }
}

function parseJavaFile(filePath, content, classes) {
    const classRegex = /class\s+([^\s{]+)/g;
    const methodRegex = /(public|protected|private|static|\s)\s+[\w<>\[\]]+\s+(\w+)\s*\(([^)]*)\)/g;

    let classMatch = classRegex.exec(content);
    if (classMatch) {
        let className = classMatch[1];
        let methods = [];
        let methodMatch;
        while ((methodMatch = methodRegex.exec(content)) !== null) {
            let methodName = methodMatch[2];
            let methodParams = methodMatch[3];
            methods.push(`${methodName}(${methodParams})`);
        }
        classes.push({ name: className, methods: methods });
    }
}

// Función de prueba
async function testGenerator() {
    const exampleRepoUrl = 'https://github.com/pedrowightman/ur_os_pp_public';
    document.getElementById('repoUrl').value = exampleRepoUrl;
    await fetchJavaFiles();
}

module.exports = {
    getGitHubApiUrl,
    fetchAndParseFiles,
    generatePlantUML,
    parseJavaFile
};
