const { execSync } = require('child_process');
const tools = ['hydra', 'sqlmap', 'nmap', 'nikto', 'ab', 'slowloris'];

tools.forEach(tool => {
    try {
        execSync(`command -v ${tool}`, { stdio: 'ignore' });
        console.log(`${tool}: OK`);
    } catch (e) {
        console.log(`${tool}: FAILED`);
    }
});
