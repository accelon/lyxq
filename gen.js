import {glob,readTextLines,writeChanged,nodefs, readTextContent, splitUTF32Char} from "ptk/nodebundle.cjs"
await nodefs;
const rawdir="raw/"
const files=glob(rawdir,"*.xhtml");
const LUNYU=[];
//const LUNYU_QIAN=[];
//const LUNYU_QIAN_EN=[];
const LYXQ=[];
const LYXQ_EN=[];
//const DICT=[];
//const DICT_EN=[];

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
            out_en.push(thechar+'\t');//補上
        }
        
        if (isen) {
            if (out_en) out_en.push(line);
        } else if (out) {
            if (thechar) line+='\t'
            out.push(line);
            if (~line.indexOf('《說文解字》：')) {//英文不譯說文正文
                out_en.push('')
            }
        } 
    }
}
const gen=fn=>{
    let content=readTextContent(rawdir+fn);
    content=content.replace(/<img src="([^\"]+)" width="\d+" height="\d+" alt="([^\"]*)"[^>]+>/g,(m,img,alt)=>{
        img=img.match(/(\d+)\.png/)[1]
        console.log(img,alt)
        return '^png'+img+(alt?'{alt:"'+alt.replace('.png','')+'"}':'');
    })
    content=content.replace(/<\/p>/g,'\n').replace(/&#xa0;/g,'');
    content=content.replace(/<style .+?<\/style>/g,'');
    content=content.replace(/<[^>]+>/g,'');

    const lines=content.split('\n');

    parseText(lines);
}

files.forEach(gen);

writeChanged('raw/lunyu.pgd',LUNYU.join('\n'),true)
writeChanged('raw/lyxq.pgd',LYXQ.join('\n'),true)
writeChanged('raw/lyxq-en.pgd',LYXQ_EN.join('\n'),true)
//writeChanged('raw/lunyu-qian.pgd',LUNYU_QIAN.join('\n'),true)
//writeChanged('raw/lunyu-qian-en.pgd',LUNYU_QIAN_EN.join('\n'),true)
//writeChanged('raw/lyxq-dict.pgd',DICT.join('\n'),true)
//writeChanged('raw/lyxq-dict-en.pgd',DICT_EN.join('\n'),true)