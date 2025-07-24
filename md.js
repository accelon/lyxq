import { appendFile } from "fs";
import {glob,writeChanged,nodefs, readTextContent, splitUTF32Char} from "./nodebundle.cjs"
await nodefs;
const rawdir="raw/"
const imagedir="raw/images/"
const files=glob(rawdir,"*.xhtml");
const images=glob(imagedir,"*.png");
const outdir='lyjdxq';
const outimgsdir='lyjdxq/imgs';
const charsdir='/chars'
if (!fs.existsSync(outdir)) fs.mkdirSync(outdir);
if (!fs.existsSync(outimgsdir)) fs.mkdirSync(outimgsdir);
if (!fs.existsSync(outdir+charsdir)) fs.mkdirSync(outdir+charsdir);
const sections={
    '【原文】':'/lunyu.md',
    '【譯文】':'/lunyu-qian.md',
    '【注釋】':'/lxjdxq.md',
    '【說明】':'/lxjdxq-explain.md',
    '【參考】':'/lxjdxq-refer.md', //也有可能是字 「摍」
}
let blockid='';
let thechar='', lastchar='';
let filename='';

const parseText=lines=>{
    let out=[];
    const emitFile=()=>{
        if (filename) {
            fs.appendFileSync(outdir+filename,out.join('\n'));
        }
        filename='';
        out.length=0;
    }
    for (let i=0;i<lines.length;i++){
        let line=lines[i];
        if (!line) continue;
        const m=line.match(/(\d\d-\d\d)/);
        if (m) {
            blockid=m[1];
            continue;
        }

        thechar=splitUTF32Char(line).length==1?line:'';
        if (thechar) {
            emitFile();
            filename='/chars/'+thechar+'.md';
            continue;
        }

        if(sections[line]) {
            emitFile();
            filename=sections[line];
            continue;
        }

        if (line) {
            out.push(line+ (filename.startsWith('/chars/')?'':(' ^'+blockid+'\n\n')));
        }
    }
    emitFile();
}
const emitted={};
const genImage=(id,img,alt)=>{
    const bitmap=fs.readFileSync(rawdir+img);
    // const base64=bitmap.toString('base64');
    if (!emitted[id]) {
        writeChanged(outdir+'/imgs/'+(alt?alt:id+'.png'), bitmap)
        // Images.push(id+'.png\t'+(alt?alt:id+'.png'));
        // Images.push(base64);    
    }
    emitted[id]=true;
}
const gen=fn=>{
    let content=readTextContent(rawdir+fn);
    content=content.replace(/<img src="([^\"]+)" width="\d+" height="\d+" alt="([^\"]*)"[^>]+>/g,(m,img,alt)=>{
        let m2=img.match(/(\d+)\.png/);
        if (m2) {
            const id=img.match(/(\d+)\.png/)[1]        
            genImage(id,img,alt);
            if (alt) {
                return '!['+id+']('+alt+')';
            } else {
                return '![['+id+'.png'+']]'
            }
            
        } else {
            const id=img.match(/(\d+)\.jpeg/)[1]        
            genImage(id,img,alt);
            if (alt) {
                return '!['+id+']('+alt+'.jpeg)';
            } else {
                return '![['+id+'.jpeg'+']]'
            }
        }
    })
    content=content.replace(/<\/p>/g,'\n').replace(/&#xa0;/g,'');
    content=content.replace(/<style .+?<\/style>/g,'');
    content=content.replace(/<[^>]+>/g,'');

    const lines=content.split('\n');

    parseText(lines);
}

files.forEach(gen);
