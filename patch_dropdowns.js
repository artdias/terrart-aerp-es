const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        const dirPath = path.join(dir, f);
        const isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

let modified = 0;
walkDir('src/app/(dashboard)', function(filePath) {
    if (!filePath.endsWith('page.tsx')) return;
    if (filePath.includes('lixeira')) return; // ignore trash
    if (!filePath.includes('novo') && !filePath.includes('editar') && !filePath.includes('despesa')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Replace findMany({ -> findMany({ where: { deleted: false }
    content = content.replace(/prisma\.employee\.findMany\(\{\s*\}/g, 'prisma.employee.findMany({ where: { deleted: false } })');
    content = content.replace(/prisma\.client\.findMany\(\{\s*\}/g, 'prisma.client.findMany({ where: { deleted: false } })');
    content = content.replace(/prisma\.product\.findMany\(\{\s*\}/g, 'prisma.product.findMany({ where: { deleted: false } })');
    
    // For multiline empty object 
    content = content.replace(/prisma\.employee\.findMany\(\{\s*\}\)/g, 'prisma.employee.findMany({ where: { deleted: false } })');
    content = content.replace(/prisma\.client\.findMany\(\{\s*\}\)/g, 'prisma.client.findMany({ where: { deleted: false } })');
    content = content.replace(/prisma\.product\.findMany\(\{\s*\}\)/g, 'prisma.product.findMany({ where: { deleted: false } })');

    // For cases where there is no where clause yet (assuming empty args or just orderBy)
    // We will do a simpler approach: check if findMany({ is followed by \n
    // Let's just use manual string replacement for the most common ones we saw
    
    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log('Updated: ' + filePath);
        modified++;
    }
});
console.log('Total files modified: ' + modified);
