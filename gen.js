import {glob,writeChanged,nodefs, readTextContent, splitUTF32Char} from "ptk/nodebundle.cjs"
await nodefs;
const rawdir="raw/"
const imagedir="raw/images/"
const files=glob(rawdir,"*.xhtml");
const images=glob(imagedir,"*.png");
const LUNYU=[];
//const LUNYU_QIAN=[];
//const LUNYU_QIAN_EN=[];
const LYXQ=[];
const LYXQ_EN=[];
//const DICT=[];
//const DICT_EN=[];
let hasen=false;
const sections={
    '【原文】':[LUNYU],
    '【譯文】':[LYXQ,LYXQ_EN],
    '【說明】':[LYXQ,LYXQ_EN],
    '【參考】':[LYXQ,LYXQ_EN],
}
let out,out_en;
let thechar='', isen=false;
const parseText=lines=>{
    for (let i=0;i<lines.length;i++){
        let line=lines[i];
        let encount=0;
        if (!line) continue;
        if (line.replace(/([a-zA-Za-z]+)/g,(m,m1)=>{
            if (m1.length>2 && m1!=='src' && m1!=='png') encount++;
        }))
        isen=encount>0;

        thechar=splitUTF32Char(line).length==1?line:'';

        const outfiles=sections[line];
        if (outfiles) {
            [out,out_en]=outfiles;
        } else if (thechar){//字頭
            out=LYXQ;
            out_en=LYXQ_EN;
            if (hasen) out_en.push(thechar+'\t');//補上
        }
        
        if (isen && hasen) {
            if (out_en) out_en.push(line);
        } else if (out) {
            if (thechar) line+='\t'
            out.push(line);
            if (hasen&&~line.indexOf('《說文解字》：')) {//英文不譯說文正文
                out_en.push('')
            }
        } 
    }
}
const Images=[];
const emitted={};
const genImage=(id,img,alt)=>{
    const bitmap=fs.readFileSync(rawdir+img);
    const base64=bitmap.toString('base64');
    if (!emitted[id]) {
        Images.push(id+'.png\t'+(alt?alt:id+'.png'));
        Images.push(base64);    
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
            return '^png'+id+(alt?'{alt:"'+alt.replace('.png','')+'"}':'');
        } else {
            const id=img.match(/(\d+)\.jpeg/)[1]        
            genImage(id,img,alt);
            return '^jpg'+id+(alt?'{alt:"'+alt.replace('.jpg','')+'"}':'');
        }
    })
    content=content.replace(/<\/p>/g,'\n').replace(/&#xa0;/g,'');
    content=content.replace(/<style .+?<\/style>/g,'');
    content=content.replace(/<[^>]+>/g,'');

    const lines=content.split('\n');

    parseText(lines);
}

files.forEach(gen);

writeChanged('out/lunyu.pgd',LUNYU.join('\n'),true)
writeChanged('out/4lyxq.pgd',LYXQ.join('\n'),true)
writeChanged('out/4lyxq-en.pgd',LYXQ_EN.join('\n'),true)
writeChanged('out/4lyxq-png.pgd',Images.join('\n'),true)
//writeChanged('raw/lunyu-qian.pgd',LUNYU_QIAN.join('\n'),true)
//writeChanged('raw/lunyu-qian-en.pgd',LUNYU_QIAN_EN.join('\n'),true)
//writeChanged('raw/lyxq-dict.pgd',DICT.join('\n'),true)
//writeChanged('raw/lyxq-dict-en.pgd',DICT_EN.join('\n'),true)