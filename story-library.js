"use strict";
(()=>{
  const SOURCE="knowledge/interview-stories.md";
  const plain=value=>String(value||"")
    .replace(/\[([^\]]+)\]\([^)]+\)/g,"$1")
    .replace(/\*\*([^*]+)\*\*/g,"$1")
    .replace(/^[-*]\s+/gm,"• ")
    .replace(/^\d+\.\s+/gm,"• ")
    .replace(/^---\s*$/gm,"")
    .replace(/`([^`]+)`/g,"$1")
    .replace(/\n{3,}/g,"\n\n").trim();
  const section=(block,name)=>{
    const escaped=name.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),match=block.match(new RegExp(`### ${escaped}\\s*\\n([\\s\\S]*?)(?=\\n#{1,3} |$)`));
    return plain(match?.[1]||"");
  };
  function parse(text){
    const recommendation={};
    for(const line of text.split("\n")){
      const row=line.match(/^\|\s*([A-Z]+-\d{2})\s*\|.*\|\s*([SABC])\s*\|$/);
      if(row)recommendation[row[1]]=row[2];
    }
    const headings=[...text.matchAll(/^## ([A-Z]+-\d{2}) (.+)$/gm)],stories=[];
    headings.forEach((match,index)=>{
      const start=match.index,end=headings[index+1]?.index??text.length,block=text.slice(start,end),before=text.slice(0,start),categories=[...before.matchAll(/^# (第[^\n]+类[^\n]*)$/gm)],category=(categories.at(-1)?.[1]||"其他").replace(/^第[^ ]+类\s*/,"");
      const tags=plain(block.match(/^\*\*标签：\*\*\s*(.+)$/m)?.[1]||"").split(/\s+/).filter(x=>x.startsWith("#")).map(x=>x.slice(1));
      const roles=plain(block.match(/^\*\*适用岗位：\*\*\s*(.+)$/m)?.[1]||"").split(/[、，,]/).map(x=>x.trim()).filter(Boolean);
      const grade=plain(block.match(/^\*\*外部表达等级：\*\*\s*(.+)$/m)?.[1]||"");
      const oneLiner=section(block,"一句话结论");
      const answer=section(block,"60 秒标准回答");
      const supportNames=["深挖抓手","好内容的六项标准","项目动作","产品判断亮点","故事抓手","适合深挖","可讲洞察","可拆成三个小故事","标准方法","面试价值","适合证明","可拆题型","高频追问"];
      const boundaryNames=["数据边界","可信边界","注意","结果口径","核心反思","可继续准备"];
      const support=supportNames.map(name=>section(block,name)).filter(Boolean).join("\n");
      const boundaries=boundaryNames.map(name=>section(block,name)).filter(Boolean).join("\n");
      stories.push({id:match[1],title:plain(match[2]),category,tags,roles,grade,recommendation:recommendation[match[1]]||"",oneLiner,answer,support,boundaries,source:"求职buddy 示例故事库"});
    });
    const kitText=(text.match(/# 第六类 岗位选题组合\s*([\s\S]*?)(?=\n# 第七类)/)||[])[1]||"",kits=[];
    for(const match of kitText.matchAll(/^## ([^\n]+)\n([\s\S]*?)(?=\n## |$)/gm))kits.push({title:match[1],items:[...match[2].matchAll(/^\d+\.\s+(.+)$/gm)].map(x=>plain(x[1]))});
    const checkText=(text.match(/# 第八类 上场前待核验清单\s*([\s\S]*)$/)||[])[1]||"",checks=[...checkText.matchAll(/^- \[ \] (.+)$/gm)].map(x=>plain(x[1]));
    return {stories,kits,checks};
  }
  const api={stories:[],kits:[],checks:[],source:SOURCE,error:""};
  api.ready=fetch(SOURCE).then(response=>{if(!response.ok)throw Error("知识库文件读取失败");return response.text()}).then(text=>Object.assign(api,parse(text))).catch(error=>{api.error=error.message;console.error(error)});
  globalThis.StoryLibrary=api;
})();
