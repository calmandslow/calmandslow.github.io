// Static portfolio demonstration. No network, model calls, or file parsing.
(() => {
  'use strict';
  const copy = value => structuredClone(value);
  const date = () => new Date().toISOString();
  let serial = 0, store, failNext = false;
  const memory = new Map();
  const timers = new Set();
  window.careerDemoStorage = {getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,String(value)),removeItem:key=>memory.delete(key)};
  const texts = {
    resume:'姓名：测试候选人\n教育：应用统计硕士，数学本科。\n个人项目：Career Agent 求职工具，设计岗位分析、简历定制与面试准备工作流，在个人开发环境验证状态保存、失败续跑与输出校验。尚未商业上线。',
    portfolio:'PickBetter：个人产品规划与原型实践。完成需求拆解、用户流程、低保真原型、指标体系与验证计划。尚未进行商业运营或线上 A/B 测试。',
    jd:'公司：示例 AI 团队\n岗位：Agent 产品经理\n职责：分析用户需求，设计 Agent 工作流，定义模型和工具执行边界，制定效果评估方案。\n要求：产品设计与数据分析基础，理解 LLM、工具调用与人工确认。'
  };
  const questions = [
    {question:'请介绍一个你设计的 Agent 项目，为什么这样安排工作流？',priority:'P0',why_likely:'JD 关注 Agent 工作流；样例材料包含个人求职工具。',follow_ups:['哪些步骤需要人工确认？','失败后如何恢复？']},
    {question:'如果评估一个数据分析 Agent，你会如何区分模型指标与用户价值？',priority:'P0',why_likely:'JD 要求制定效果评估方案；样例材料包含统计背景和指标设计。',follow_ups:['为什么任务完成率还不够？','如何验证用户真的省时间？']},
    {question:'简历定制如何提升岗位匹配，同时避免夸大经历？',priority:'P1',why_likely:'考察生成质量与事实约束。',follow_ups:['用户修改后是否重新审查？']}
  ];
  const recommended = [
    '我以自己的求职准备为场景，设计了 JD 分析、简历定制和面试准备流程。先跑通流程与状态，再接模型；每个岗位保留材料快照，输出需要事实检查与用户确认。它目前是个人实践，不能把流程验证说成企业上线成果。',
    '我会先明确任务、用户和交付，再分别看模型输出的准确性、任务完成情况、控制错误和用户主动操作时间。评估时间时计入检查与确认成本。这里是我的评估思路，尚未进行真实线上实验。',
    '我会从 JD 提取要求，用真实材料建立证据，把匹配度提升放在表达顺序和内容选择上。无法证实的结果不补写；事实审查和用户核对之后再使用。'
  ];
  function makeApp(company='示例 AI 团队',role='Agent 产品经理') {
    return {application_id:'job_demo_'+(++serial),company,role,current_stage:'created',created_at:date(),updated_at:date(),jd:'',base_resume:'',portfolio:'',jd_profile:null,tailored_resume:null,interview_prep_profile:null,answer_prep_profile:null,pending_validation_output:null,validation_issues:[],resume_change_notes:[],resume_claim_audit:[],resume_semantic_review_history:[],answer_reviews:[],answer_review_passed:[],answer_confirmed:[],answer_hashes:[],web:{material_snapshot:null,resume_draft:null}};
  }
  function material(kind,name,appId=null){return {material_id:'mat_demo_'+(++serial),kind,name,application_id:appId,status:'ready',active:true,created_at:date(),text:texts[kind],characters:texts[kind].length};}
  function invalidate(a,from='jd') {
    if(from==='jd')a.jd_profile=null;
    a.tailored_resume=null;a.interview_prep_profile=null;a.answer_prep_profile=null;a.pending_validation_output=null;
    a.answer_review_passed=[];a.answer_confirmed=[];a.answer_hashes=[];a.resume_change_notes=[];a.resume_claim_audit=[];a.resume_semantic_review_history=[];a.answer_reviews=[];
    if(a.web.resume_draft)a.web.resume_draft.status='stale';
    a.current_stage='created';
  }
  function bind(a){
    const resume=store.materials.find(m=>m.kind==='resume'&&m.active&&!m.application_id);
    if(!resume)throw new Error('请先在基础材料中选择一份示例简历。');
    const portfolio=store.materials.filter(m=>m.kind==='portfolio'&&m.active&&!m.application_id);
    invalidate(a,'resume');a.base_resume=resume.text;a.portfolio=portfolio.map(m=>m.text).join('\n');
    a.web.material_snapshot={bound_at:date(),resume:{name:resume.name,material_id:resume.material_id},portfolio:portfolio.map(m=>({name:m.name,material_id:m.material_id}))};
  }
  function reset(){
    timers.forEach(clearTimeout);timers.clear();memory.clear();failNext=false;
    const app=makeApp();store={apps:[app],deleted:[],materials:[material('resume','sample_resume.md'),material('portfolio','sample_portfolio.md'),material('jd','sample_jd.md',app.application_id)],tasks:[],sessions:[]};
    app.jd=texts.jd;bind(app);memory.set('career-current-job',app.application_id);
  }
  function schedule(fn,ms){const timer=setTimeout(()=>{timers.delete(timer);fn();},ms);timers.add(timer);}
  function task(action,appId,payload,work){
    if(store.tasks.some(t=>t.application_id===appId&&t.status==='running'))throw new Error('该岗位正在演示，请等待本步骤完成。');
    const t={task_id:'task_demo_'+(++serial),application_id:appId,action,payload:copy(payload||{}),provider:'demo',status:'running',created_at:date(),logs:[{message:'示例流程开始；无模型调用。'}],result:null,error:null};
    store.tasks.unshift(t);
    const fail=failNext;failNext=false;
    schedule(()=>t.logs.push({message:fail?'演示：连接中断，保留当前进度。':'检查示例材料与当前进度。'}),350);
    schedule(()=>{try{if(fail)throw new Error('模拟连接失败。点击“继续这个任务”，复用已完成步骤。');t.result=work();t.status='completed';t.logs.push({message:'示例交付完成；记录仅保留在本页。'});}catch(e){t.status='failed';t.error=e.message;}},1000);
    return copy(t);
  }
  function profile(a){if(!a.jd)throw new Error('先选择 JD 文件；本演示仅显示固定样例。');if(!a.jd_profile)a.jd_profile={company:a.company,role_title:a.role,role_summary:'为办公任务设计可靠、可检查的 Agent 工作流。',seniority:'以实际 JD 为准',responsibilities:[{item:'设计 Agent 工作流与人工确认节点',priority:'P0',evidence:'设计 Agent 工作流'}],requirements:[{item:'产品设计与数据分析基础',priority:'P0',category:'能力',evidence:'产品设计与数据分析基础'}],keywords:['Agent 工作流','效果评估','人工确认'],ambiguities:['团队规模、具体业务与任职年限需确认'],hidden_expectations:['明确模型、工具与用户的责任边界']};}
  function resume(a){
    profile(a);if(!a.base_resume)throw new Error('请先使用当前基础材料。');if(a.tailored_resume)return;
    a.tailored_resume='测试候选人 / '+a.role+'\n\n数学本科 · 应用统计硕士\n\n个人项目：Career Agent\n• 设计 JD 分析、简历定制、面试准备工作流。\n• 在个人开发环境验证状态保存、失败续跑与输出校验。\n\nPickBetter 产品规划实践\n• 完成需求拆解、用户流程、低保真原型、指标与验证方案。\n\n边界：个人项目与原型实践，尚未商业上线。';
    a.resume_change_notes=['将工作流设计与验证能力放到前面。','保留“个人实践”边界，没有补写上线指标或企业经历。'];
    a.resume_claim_audit=[{claim:'完成个人项目工作流设计与流程验证',rationale:'对应样例简历；不延伸为企业落地成果。',evidence_ids:['sample_resume.md']}];
    a.resume_semantic_review_history=[{reviews:[{verdict:'supported',rationale:'示例审查：保留原材料中的实施边界，不添加商业成果。'}]}];
  }
  function prep(a){resume(a);if(!a.interview_prep_profile)a.interview_prep_profile={questions:copy(questions)};a.interview_research_profile={findings:[{finding:'示例问题来自岗位要求与候选材料对应关系。'}],limitations:['网页演示未检索外部面试经历。']};}
  function prepareAnswers(a){
    prep(a);if(a.answer_prep_profile||a.pending_validation_output)return;
    a.pending_validation_output={answers:questions.map((q,i)=>({question:q.question,answer_mode:i===1?'hypothetical':'experience',recommended_answer:recommended[i],answer_skeleton:['明确问题与个人角色','说明判断、行动与实施边界'],missing_information:[],answer_risks:['核对回答是否符合自己的实际经历'],evidence_to_use:['sample_resume.md','sample_portfolio.md']}))};
    a.current_stage='waiting_for_human_review_interview-answer-coach';a.answer_review_passed=[false,false,false];a.answer_confirmed=[false,false,false];a.answer_hashes=questions.map((_,i)=>'demo-answer-'+i);
  }
  function answers(a){return a.pending_validation_output||a.answer_prep_profile;}
  function run(a,action,payload){
    if(action==='analyze')profile(a);
    else if(action==='resume')resume(a);
    else if(action==='questions')prep(a);
    else if(action==='answers')prepareAnswers(a);
    else if(action==='review_answers'){prepareAnswers(a);a.answer_review_passed=answers(a).answers.map(()=>true);a.answer_reviews=[{question_number:1,review:{verdict:'pass',issues:[]}}];}
    else if(action==='update_answer'){
      prepareAnswers(a);const i=Number(payload.question_index);if(!answers(a).answers[i])throw new Error('找不到这道题。');if(!payload.feedback?.trim())throw new Error('请先填写修改意见。');
      answers(a).answers[i].recommended_answer= recommended[i]+'\n\n【演示批注】已记录你的修改意见：'+payload.feedback+'\n此原型不生成新的答案。';
      a.answer_review_passed[i]=false;a.answer_confirmed[i]=false;a.answer_hashes[i]='demo-version-'+(++serial);
    }else throw new Error('本原型未提供此操作。');
    if(!a.pending_validation_output)a.current_stage='completed';return {status:a.current_stage};
  }
  function sessionSummary(s){return {...s,turn_count:s.turns.length};}
  function feedback(s){
    s.phase='completed';s.feedback={overall_assessment:'固定示例反馈，用于展示面试结束后的阅读体验，不评价你刚才输入的回答。',questions:s.questions.map((_,i)=>({main_index:i,level:'not_evaluated',what_worked:['示例建议：明确说明问题、个人角色与所做的判断。'],gaps:[],optional_tips:['补充一个具体的验证方法。'],fact_notes:['个人项目和假设方案需要与真实上线成果区分。'],reasoning_steps:[],supplement:'',reference_answer:'',practice_follow_up:'你如何判断这个方案比原来的做法更有效？'})),next_actions:['核对自己的事实与实施边界。','选一道题，用自己的话重新练习。']};
  }
  function advance(s){s.main_index++;s.current_kind='main';if(s.main_index>=s.questions.length)feedback(s);else{s.current_question=s.questions[s.main_index];s.phase='awaiting_answer';}}
  function turn(s,operation){
    if(operation==='finish'||operation==='feedback')feedback(s);
    else if(operation==='skip'||operation==='move_on')advance(s);
    else if(operation==='answer'||operation==='resume'){
      if(s.current_kind==='main'){
        s.decisions.push({main_index:s.main_index,action:'follow_up',follow_up_kind:'extension',answer_quality:'not_evaluated',rationale:'固定延伸追问，网页原型没有判断回答质量。'});
        s.current_question=questions[s.main_index%questions.length].follow_ups[0];s.current_kind='follow_up';s.phase='awaiting_answer';
      }else advance(s);
    }
    return {status:s.phase};
  }
  function findApp(id){const a=store.apps.find(a=>a.application_id===id);if(!a)throw new Error('找不到该示例岗位。');return a;}
  async function request(path,{method='GET',body={}}={}){
    const p=path.split('?')[0].split('/').filter(Boolean);
    if(path==='/config')return {provider:'demo',routes:{fast:'网页固定示例',core:'网页固定示例',review:'网页固定示例'},pricing_note:'无模型调用、无 Token 费用。状态仅保留在当前原型页面。'};
    if(p[0]==='materials'){
      if(method==='GET')return store.materials;
      if(p[2]==='deactivate'){const m=store.materials.find(m=>m.material_id===p[1]);if(!m)throw new Error('找不到材料');m.active=false;if(m.application_id){const a=findApp(m.application_id);a.jd=store.materials.filter(x=>x.application_id===a.application_id&&x.active).map(x=>x.text).join('\n');invalidate(a);}return {status:'completed'};}
      const file=body.get('file'),kind=body.get('kind'),id=body.get('application_id')||null;
      if(!texts[kind]||!file)throw new Error('请选择示例文件。');
      const m=material(kind,file.name||'sample_'+kind+'.md',id);
      if(kind==='resume')store.materials.filter(x=>x.kind==='resume'&&!x.application_id).forEach(x=>x.active=false);
      store.materials.push(m);if(id){const a=findApp(id);a.jd=texts.jd;invalidate(a);}
      const t=task('parse_material',id,{},()=>({status:'completed'}));return {material:m,task:t};
    }
    if(p[0]==='deleted-applications'){
      if(method==='GET')return store.deleted;
      const i=store.deleted.findIndex(a=>a.application_id===p[1]);if(i<0)throw new Error('找不到已删除岗位。');store.apps.push(store.deleted.splice(i,1)[0]);return {status:'completed'};
    }
    if(p[0]==='tasks'){
      if(p.length===1)return store.tasks.filter(t=>!store.deleted.some(a=>a.application_id===t.application_id));
      const t=store.tasks.find(t=>t.task_id===p[1]);if(!t)throw new Error('找不到任务。');
      if(p[2]==='retry'){
        if(t.retried_as)return store.tasks.find(x=>x.task_id===t.retried_as);
        const next=task(t.action,t.application_id,t.payload,()=>t.action==='interview'?turn(store.sessions.find(s=>s.session_id===t.payload.session_id),t.payload.operation):t.action==='parse_material'?{status:'completed'}:run(findApp(t.application_id),t.action,t.payload));t.retried_as=next.task_id;return next;
      }return t;
    }
    if(p[0]!=='applications')throw new Error('本演示不提供该接口。');
    if(p.length===1){if(method==='POST'){const a=makeApp(body.company||'示例 AI 团队',body.role||'Agent 产品经理');store.apps.push(a);return a;}return store.apps;}
    const a=findApp(p[1]);
    if(p.length===2){if(method==='DELETE'){if(store.tasks.some(t=>t.application_id===a.application_id&&t.status==='running'))throw new Error('请等待当前任务完成。');store.apps=store.apps.filter(x=>x!==a);store.deleted.push(a);return {status:'completed'};}if(method==='PATCH'){a.company=body.company;a.role=body.role;}return a;}
    if(p[2]==='bind-materials'){bind(a);return a;}
    if(p[2]==='resume-draft'){a.web.resume_draft={text:body.text,status:'user_edited_unreviewed'};return a;}
    if(p[2]==='jd-profile'){invalidate(a);a.jd_profile=copy(body);a.company=body.company;a.role=body.role_title;return a;}
    if(p[2]==='tasks')return task(body.action,a.application_id,body,()=>run(a,body.action,body));
    if(p[2]==='confirm-answer'){
      const i=body.question_index;if(a.answer_hashes[i]!==body.answer_hash)throw new Error('答案版本已变化，请重新核对。');
      if(!a.answer_review_passed[i])return {status:'review_required'};
      a.answer_confirmed[i]=true;const all=a.answer_confirmed.every(Boolean);if(all){a.answer_prep_profile=a.pending_validation_output||a.answer_prep_profile;a.pending_validation_output=null;a.current_stage='completed';}return {status:'completed',all_confirmed:all};
    }
    if(p[2]==='approve'){return {status:'completed'};}
    if(p[2]==='sessions'){
      if(p.length===3){if(method==='GET')return store.sessions.filter(s=>s.application_id===a.application_id).map(sessionSummary);if(!a.interview_prep_profile)throw new Error('请先生成面试问题。');const count=Number(body.count);if(!Number.isInteger(count)||count<1||count>10)throw new Error('主问题数量需为 1–10。');const qs=Array.from({length:count},(_,i)=>questions[i%questions.length].question);const s={session_id:'session_demo_'+(++serial),application_id:a.application_id,provider:'demo',created_at:date(),phase:'awaiting_answer',main_index:0,current_kind:'main',current_question:qs[0],questions:qs,turns:[],decisions:[],feedback:null};store.sessions.unshift(s);return s;}
      const s=store.sessions.find(s=>s.session_id===p[3]&&s.application_id===a.application_id);if(!s)throw new Error('找不到面试会话。');if(p.length===4)return s;
      const operation=body.operation;if(operation==='answer'){if(s.phase!=='awaiting_answer')throw new Error('请等待当前步骤完成。');s.turns.push({kind:s.current_kind,main_index:s.main_index,question:s.current_question,answer:body.answer});s.phase='evaluate';}
      return task('interview',a.application_id,{...body,session_id:s.session_id},()=>turn(s,operation));
    }
    throw new Error('本原型尚未提供这个操作。');
  }
  reset();
  window.careerDemoAPI=async(path,options)=>copy(await request(path,options));
  window.careerDemoReset=reset;
  window.careerDemoFailNext=()=>{failNext=true;};
  window.careerDemoDownload=(id,kind,sid)=>{
    const a=findApp(id),s=store.sessions.find(s=>s.session_id===sid);
    let text=kind==='resume'?a.tailored_resume:kind==='draft'?a.web.resume_draft?.text:kind==='answers'?answers(a)?.answers.map(x=>x.question+'\n'+x.recommended_answer).join('\n\n'):kind==='transcript'?s?.turns.map(t=>t.question+'\n'+t.answer).join('\n\n'):JSON.stringify(kind==='state'?a:kind==='feedback'?s?.feedback:s,null,2);
    return 'data:text/plain;charset=utf-8,'+encodeURIComponent('网页原型 / 演示记录\n\n'+(text||'尚无演示输出。'));
  };
})();
