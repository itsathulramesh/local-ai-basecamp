/* Interactive calculators, demos and the glossary data. */
/* ---------- Shared data ---------- */
var GPUS=[
 {n:'GTX 1650 (4 GB)',v:4,bw:128},{n:'GTX 1650 GDDR6 (4 GB)',v:4,bw:192},{n:'GTX 1660 (6 GB)',v:6,bw:192},{n:'GTX 1660 Super (6 GB)',v:6,bw:336},{n:'RTX 2060 (6 GB)',v:6,bw:336},{n:'RTX 3050 laptop (4 GB)',v:4,bw:192},{n:'RTX 3050 (6 GB)',v:6,bw:168},{n:'RTX 4050 laptop (6 GB)',v:6,bw:192},{n:'RTX 4060 laptop (8 GB)',v:8,bw:256},{n:'RTX 3060 (12 GB)',v:12,bw:360},
 {n:'RTX 3060 Ti (8 GB)',v:8,bw:448},{n:'RTX 3070 (8 GB)',v:8,bw:448},{n:'RTX 3080 (10 GB)',v:10,bw:760},
 {n:'RTX 3090 (24 GB)',v:24,bw:936},{n:'RTX 4060 (8 GB)',v:8,bw:272},{n:'RTX 4060 Ti (8 GB)',v:8,bw:288},
 {n:'RTX 4060 Ti (16 GB)',v:16,bw:288},{n:'RTX 4070 / 4070 Super (12 GB)',v:12,bw:504},{n:'RTX 4070 Ti Super (16 GB)',v:16,bw:672},
 {n:'RTX 4080 / 4080 Super (16 GB)',v:16,bw:717},{n:'RTX 4090 (24 GB)',v:24,bw:1008},
 {n:'RTX 5060 (8 GB)',v:8,bw:448},{n:'RTX 5060 Ti (16 GB)',v:16,bw:448},{n:'RTX 5070 (12 GB)',v:12,bw:672},
 {n:'RTX 5070 Ti (16 GB)',v:16,bw:896},{n:'RTX 5080 (16 GB)',v:16,bw:960},{n:'RTX 5090 (32 GB)',v:32,bw:1792}
];
var QUANTS=[
 {k:'F16',b:16,t:'Original quality'},{k:'Q8_0',b:8.5,t:'Almost lossless'},{k:'Q6_K',b:6.56,t:'Very close'},
 {k:'Q5_K_M',b:5.69,t:'Close'},{k:'Q4_K_M',b:4.89,t:'Usual sweet spot'},{k:'Q3_K_M',b:3.91,t:'Noticeable loss'},{k:'Q2_K',b:3.35,t:'Large loss'}
];
var SIZES=[1,3,4,7,8,9,12,14,20,27,32,35,70];
var VRAMS=[4,6,8,10,12,16,24,32];
var CTXS=[2048,4096,8192,16384,32768,65536,131072];
var GIB=1073741824;

function $(s,r){return (r||document).querySelector(s)}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function fmt(n,d){return Number(n).toFixed(d===undefined?1:d)}
function opts(arr,sel,labelFn){return arr.map(function(x){return '<option value="'+x+'"'+(x==sel?' selected':'')+'>'+(labelFn?labelFn(x):x)+'</option>'}).join('')}
function ctxLabel(c){return c>=1024?(c/1024)+'K':c}

/* Typical architecture shape by size class (Llama 3 / Qwen 3 style grouped-query attention) */
function shapeFor(p){
 if(p<=2.5)return {L:28,kv:8,hd:128};
 if(p<=10)return {L:36,kv:8,hd:128};
 if(p<=16)return {L:40,kv:8,hd:128};
 if(p<=40)return {L:64,kv:8,hd:128};
 return {L:80,kv:8,hd:128};
}
function kvPerTok(p,bytes){var s=shapeFor(p);return 2*s.L*s.kv*s.hd*bytes}
/* Everything returned in GiB, the unit nvidia-smi and Windows use */
function fitCalc(o){
 var w=o.params*1e9*o.bits/8/GIB;
 var kvb=o.kv8?1:2;
 var kv=kvPerTok(o.params,kvb)*o.ctx/GIB;
 var ovh=1.2, rsv=o.display?0.8:0.2;
 var total=w+kv+ovh+rsv;
 var room=o.vram-w-ovh-rsv;
 var maxCtx=room>0?Math.floor(room*GIB/kvPerTok(o.params,kvb)):0;
 return {w:w,kv:kv,ovh:ovh,rsv:rsv,total:total,room:room,maxCtx:maxCtx,vram:o.vram};
}
function barHtml(r,withLabels){
 var scale=Math.max(r.vram,r.total);
 var seg=function(c,v){return '<span class="'+c+'" style="width:'+(v/scale*100)+'%"></span>'};
 var free=Math.max(0,r.vram-r.total);
 var html='<div class="vbar-wrap"><div class="vbar" role="img" aria-label="VRAM budget bar">'+
  seg('s-r',r.rsv)+seg('s-o',r.ovh)+seg('s-w',r.w)+seg('s-k',r.kv)+seg('s-f',free)+
  '<i class="vmark" data-l="'+fmt(r.vram,0)+' GB card" style="left:calc('+(r.vram/scale*100)+'% - 1px)"></i></div></div>';
 if(withLabels!==false){
  html+='<div class="legend"><span><i class="s-w"></i>Weights '+fmt(r.w)+'</span><span><i class="s-k"></i>Context cache '+fmt(r.kv)+'</span><span><i class="s-o"></i>Overhead '+fmt(r.ovh)+'</span><span><i class="s-r"></i>Windows '+fmt(r.rsv)+'</span></div>';
 }
 return html;
}

/* ---------- Glossary ---------- */
var GLOSSARY=[
['Ablation (directional)','Removing a direction from a model’s activations or weights so it can no longer represent that feature. Lesson 10.3.'],
['Activation steering','Adding a direction vector to a layer’s output while the model runs, to push behaviour (length, tone) without training. Lesson 10.2.'],
['Alpha (LoRA)','A scaling knob: the adapter’s output is multiplied by alpha ÷ r.'],
['Attention','The part of a transformer block that lets each token pull information from earlier tokens.'],
['Backpropagation','The algorithm that computes the gradient for every weight at once.'],
['Catastrophic forgetting','When training on a narrow task erodes a model’s general abilities.'],
['Contrast pair','Two prompts that differ only in the property you want to isolate. Used to find directions.'],
['Control vector','llama.cpp’s file format for steering vectors, applied with llama-server.'],
['Difference of means','Average activations for two prompt sets and subtract, to find a direction.'],
['EOS token','The end-of-sequence or end-of-turn token. Generation stops when the model produces it.'],
['GRPO','A reinforcement-learning method that rewards the better of several attempts. Used for reasoning models.'],
['Healing','A short DPO or SFT run after a weight edit to recover lost quality.'],
['Importance matrix (imatrix)','Statistics on which weights matter most, used to make low-bit quantization more accurate.'],
['JSONL','JSON Lines: one complete JSON object per line. The usual training-data format.'],
['Learning rate','The size of each training step. Too high diverges, too low crawls.'],
['Merging (adapter)','Folding a LoRA adapter into the base weights so the model runs without adapter support.'],
['Merging (models)','Combining models with the same base into one, for example with mergekit (linear, SLERP, TIES, DARE).'],
['MLP','The per-token feed-forward part of a transformer block. Stores many associations.'],
['Optimizer','The rule that turns gradients into weight updates. AdamW is the usual choice.'],
['Rank (LoRA)','The width of the adapter’s bottleneck: how many independent directions of change it can learn.'],
['Residual stream','The running vector each token carries through the layers. Every layer reads it and adds to it.'],
['ROME / MEMIT','Methods that rewrite specific facts by editing MLP weights.'],
['Special tokens','Single tokens with structural meaning, such as the markers for the start and end of a chat turn.'],
['Synthetic data','Training examples drafted by a model (the teacher), then reviewed.'],
['Target modules','The weight matrices that receive LoRA adapters, such as q_proj and down_proj.'],
['Task vector','Fine-tuned weights minus base weights: the change a fine-tune made.'],
['Teacher / student','The teacher model writes examples; the student is the model being trained on them.'],
['Train on responses only','Masking everything except assistant replies so the loss only grades the answers.'],
['Unsloth','An open-source library that makes LoRA fine-tuning faster and lighter on NVIDIA GPUs, and exports to GGUF.'],
['Validation set','Examples held out during training to detect overfitting.'],
['Writer weights','The matrices that add to the residual stream: embed_tokens, o_proj, out_proj and down_proj.'],
['Byte-pair encoding (BPE)','The usual way tokenizers are built: repeatedly merge the most frequent pair of symbols into a new token.'],
['Chunk','A piece of a document, a few hundred tokens long, that is embedded and retrieved as a unit in RAG.'],
['Constrained decoding','Blocking every token that would break a grammar or JSON schema, so output always has the required shape.'],
['Cosine similarity','How closely two vectors point in the same direction. 1 is identical, 0 is unrelated. Used to compare embeddings.'],
['Greedy decoding','Always picking the single most likely next token.'],
['KL divergence','How different two probability distributions are. Used to measure how much quantization changed a model.'],
['Logit','The raw score a model gives each possible next token before softmax.'],
['Perplexity','How surprised a model is by real text. Lower is better. Used to compare quantizations.'],
['Prefill / decode','Prefill reads the whole prompt in parallel (compute-bound). Decode writes one token at a time (bandwidth-bound).'],
['Pydantic','A Python library for defining data shapes as classes and validating JSON against them.'],
['Reward model','A model trained on human comparisons to score answers. Used in RLHF.'],
['Softmax','The function that turns logits into probabilities that add up to 1.'],
['Tool calling','Letting a model request that your code run a function, then continue with the result.'],
['Abliteration','Editing a model’s weights to remove the direction linked to refusing requests. Produces "abliterated" models. Lesson 5.2.'],
['Adapter','A small set of extra trained weights added to a frozen model, as produced by LoRA. Can be switched on and off or merged.'],
['Agent','A program that lets a model decide on actions, such as running tools, in a loop until a goal is met.'],
['Alignment','Training that steers a model to be helpful, honest and harmless, including learning when to decline.'],
['Base model','A model after pre-training only. It continues text but does not follow instructions well.'],
['Batch size','How many examples are processed together during training or serving.'],
['BF16','A 16-bit number format used in training, with the same range as 32-bit numbers.'],
['Benchmark','A standard test used to compare models. Useful but narrow.'],
['Bandwidth (memory)','How fast data can be read from memory, in GB/s. It sets the speed limit for generating tokens.'],
['Chat template','The exact text format a model expects around system, user and assistant messages. The wrong one gives odd output.'],
['Checkpoint','A saved snapshot of a model’s weights, often during training.'],
['Context window','The maximum number of tokens a model can look at at once. Its working memory.'],
['CUDA','NVIDIA’s platform for running general computing, including AI, on its GPUs.'],
['Dataset','A collection of examples used for training or evaluation.'],
['Dense model','A model that uses all of its parameters for every token.'],
['Decoding','Producing the answer one token at a time. Also called generation.'],
['Distillation','Training a smaller model to imitate a bigger one’s answers.'],
['DPO','Direct Preference Optimization. Training on pairs of preferred and rejected answers, without a separate reward model.'],
['Embedding','A list of numbers that represents the meaning of a piece of text, so similar meanings are close together.'],
['Epoch','One full pass through the training dataset.'],
['Evaluation (evals)','Testing a model on held-out examples to measure whether a change helped.'],
['Few-shot prompting','Including a few input-output examples in the prompt to show the pattern wanted.'],
['Fine-tuning','Training an existing model a little more on your own examples.'],
['Flash Attention','A faster, more memory-efficient way of computing attention.'],
['GGUF','The single-file model format used by llama.cpp, LM Studio and Ollama, designed for quantized local inference.'],
['GPU offload','Placing some or all of a model’s layers on the GPU. The rest run on the CPU.'],
['GPU','Graphics processing unit. Thousands of small cores that run model arithmetic in parallel.'],
['Gradient descent','The method that adjusts weights step by step to reduce error during training.'],
['Hallucination','When a model states something false but plausible.'],
['Hugging Face','The main website for sharing open models, datasets and code.'],
['Inference','Using a trained model to produce output. Chatting is inference.'],
['Instruct model','A model tuned to follow instructions and chat. Usually what you want.'],
['KV cache','Memory holding the processed state of every token so far. It grows with context length and lives in VRAM.'],
['Layer','One stage of a neural network. Models stack dozens of them.'],
['llama.cpp','The open-source engine behind LM Studio and Ollama, and the home of GGUF.'],
['LLM','Large language model. A neural network trained to predict the next token of text.'],
['Loss','A number that measures how wrong the model is during training. Lower is better.'],
['LoRA','Low-Rank Adaptation. Trains a small add-on instead of all the weights, making fine-tuning cheap.'],
['Memory bandwidth','See Bandwidth.'],
['MoE (mixture of experts)','A model with many specialist sub-networks where only a few are used per token. "35B-A3B" means 35 billion total, 3 billion active.'],
['Model','A function with many adjustable numbers (weights) that turns input into output.'],
['Open-weight','A model whose trained weights are published for download, though not necessarily the training data.'],
['Overfitting','When a model memorises its training examples and does worse on new ones.'],
['Parameter','Another word for a weight. "9B" means about nine billion of them.'],
['PEFT','Parameter-Efficient Fine-Tuning. A family of methods including LoRA.'],
['Pre-training','The first, very expensive stage where a model learns to predict text from huge amounts of data.'],
['Prompt','The text you give a model.'],
['Prompt injection','Hidden instructions in text a model reads that try to steer it.'],
['QLoRA','LoRA applied to a model held in 4-bit precision, so big models can be fine-tuned on small GPUs.'],
['Quantization','Storing weights with fewer bits to shrink the model, at a small cost in quality.'],
['RAG','Retrieval-Augmented Generation. Search your documents first, then give the relevant passages to the model.'],
['Refusal','A model declining to answer a request.'],
['RLHF','Reinforcement learning from human feedback. Training using ratings of answers to shape behaviour.'],
['Safetensors','A safe, fast file format for model weights that cannot run hidden code when loaded.'],
['Sampling','The rule that picks the next token from the model’s scores.'],
['SFT','Supervised fine-tuning. Training on prompt and ideal-answer pairs.'],
['System prompt','Instructions given before the conversation that set the model’s role and rules.'],
['Temperature','A setting that sharpens or flattens the model’s probabilities. Low is focused, high is varied.'],
['Token','A small piece of text, roughly three quarters of an English word, that the model reads and writes.'],
['Tokenizer','The program that splits text into tokens and turns them into numbers.'],
['Tokens per second','How fast a model generates text.'],
['Top-k / Top-p / Min-p','Sampling filters that limit which candidate tokens can be picked.'],
['Transformer','The neural network design behind modern LLMs, built on attention.'],
['Unified memory','Memory shared by CPU and GPU, as on Apple Silicon Macs. Your NVIDIA PC has separate VRAM.'],
['VRAM','The GPU’s own fast memory. The model must fit here to run at full speed.'],
['Weights','The learned numbers inside a model. The model file is mostly weights.'],
['WSL2','Windows Subsystem for Linux. Runs real Linux inside Windows, and can use your NVIDIA GPU.']
];

/* ---------- Widgets ---------- */
var WIDGETS={};

WIDGETS.tokens=function(el){
 el.innerHTML='<div class="wt"><span>Toy tokenizer</span><span>Approximation. Real tokenizers differ.</span></div>'+
 '<div class="wgrid" style="grid-template-columns:1fr"><label>Type or paste text<textarea id="tk-in" spellcheck="false">Local AI models run on your own graphics card. Unbelievable, right? A 12 GB card can hold a 9B model at Q4_K_M with 8192 tokens of context.</textarea></label></div>'+
 '<div class="wgrid"><label>Context window<select id="tk-ctx">'+opts([4096,8192,32768,131072],8192,ctxLabel)+'</select></label></div>'+
 '<div class="chips" id="tk-chips" aria-label="Tokens"></div><div class="out" id="tk-out"></div>';
 var inp=$('#tk-in',el),sel=$('#tk-ctx',el);
 function tok(text){
  var raw=text.match(/\s?[A-Za-z]+|\s?\d{1,3}|\s?[^\sA-Za-z\d]|\s+/g)||[];
  var out=[];
  raw.forEach(function(t){
   var lead=t.match(/^\s?/)[0],body=t.slice(lead.length);
   if(/^[A-Za-z]+$/.test(body)&&body.length>7){
    for(var i=0,first=true;i<body.length;i+=5){out.push((first?lead:'')+body.slice(i,i+5));first=false}
   }else out.push(t);
  });
  return out;
 }
 function run(){
  var text=inp.value,t=tok(text),n=t.length,win=+sel.value;
  $('#tk-chips',el).innerHTML=t.slice(0,400).map(function(x){return '<span>'+esc(x.replace(/\n/g,'↵'))+'</span>'}).join('')+(t.length>400?'<span>…</span>':'');
  var pct=Math.min(100,n/win*100);
  $('#tk-out',el).innerHTML='<p><b>'+n+'</b> tokens from <b>'+text.length+'</b> characters ('+(n?fmt(text.length/n):'0')+' characters per token). About <b>'+Math.round(n*0.75)+'</b> English words.</p>'+
   '<div class="meter" role="img" aria-label="Context used"><i style="width:'+pct+'%"></i></div>'+
   '<p class="note">That uses '+fmt(pct,pct<1?3:1)+'% of a '+ctxLabel(win)+' token context window. Try a long word, a number, code, or another language and watch the count change.</p>';
 }
 inp.addEventListener('input',run);sel.addEventListener('change',run);run();
};

WIDGETS.quant=function(el){
 el.innerHTML='<div class="wt"><span>Quantization explorer</span><span>File size = parameters × bits ÷ 8</span></div>'+
 '<div class="wgrid"><label>Model size (billions of parameters)<select id="q-p">'+opts(SIZES,9,function(x){return x+'B'})+'</select></label>'+
 '<label>Your VRAM<select id="q-v">'+opts(VRAMS,12,function(x){return x+' GB'})+'</select></label></div>'+
 '<div class="bars" id="q-rows"></div><p class="note">Bars show file size in decimal GB, as download pages list them. "Fits" means the file leaves at least 2.5 GB for context cache and overhead on your card. Bits per weight are typical averages for llama.cpp quantizations.</p>';
 var p=$('#q-p',el),v=$('#q-v',el);
 function run(){
  var P=+p.value,V=+v.value,maxS=P*16/8;
  $('#q-rows',el).innerHTML=QUANTS.map(function(q){
   var s=P*q.b/8,fits=s+2.5<=V,tight=!fits&&s+1.2<=V;
   var tag=fits?'fits':(tight?'tight':'too big');
   return '<div class="brow qbar'+(fits||tight?'':' nofit')+'"><span class="lbl">'+q.k+'</span><span class="track"><span class="fill" style="display:block;width:'+(s/maxS*100)+'%"></span></span><span class="pct">'+fmt(s)+' GB</span></div>'+
    '<div style="font-size:.74rem;color:var(--muted);margin:-2px 0 4px 106px">'+q.t+' · <b style="color:var(--ink)">'+tag+'</b> on '+V+' GB</div>';
  }).join('');
 }
 p.addEventListener('change',run);v.addEventListener('change',run);run();
};

/* ---------- GPU + RAM offload model ----------
   llama.cpp (LM Studio, Ollama) puts as many layers as fit on the GPU and runs the rest
   from system RAM on the CPU. Each token reads the GPU part at GPU bandwidth and the RAM
   part at RAM bandwidth, so time per token is the sum of the two. */
var RAMS=[8,16,24,32,48,64];
function offloadCalc(o){
 var f=fitCalc(o);
 var ramFree=Math.max(0,o.ram-5);                 /* Windows + apps keep about 5 GB */
 var gpuRoom=o.vram-f.rsv-f.ovh-f.kv;             /* cache and buffers stay on the GPU first */
 var gpuW=Math.max(0,Math.min(f.w,gpuRoom));
 var cpuNeed=(f.w-gpuW)+(gpuRoom<0?-gpuRoom:0);
 var zone=cpuNeed<=0.001?'gpu':(cpuNeed<=ramFree?'split':'none');
 var g=GIB/1e9;
 var t=(gpuW*g)/(o.gbw*0.65)+(cpuNeed*g)/(o.rbw*0.6);
 return {f:f,gpuW:gpuW,cpu:cpuNeed,ramFree:ramFree,zone:zone,tps:t>0?1/t:0,pct:f.w?gpuW/f.w:1};
}
function ramBarHtml(r,ram){
 var scale=Math.max(ram,5+r.cpu),pct=function(v){return (v/scale*100)+'%'};
 return '<p class="note" style="margin:8px 0 2px"><b>System RAM</b></p><div class="vbar-wrap"><div class="vbar" role="img" aria-label="System RAM bar">'+
  '<span class="s-r" style="width:'+pct(Math.min(5,ram))+'"></span><span class="s-x" style="width:'+pct(r.cpu)+'"></span>'+
  '<i class="vmark" data-l="'+ram+' GB RAM" style="left:calc('+(ram/scale*100)+'% - 1px)"></i></div></div>'+
  '<div class="legend"><span><i class="s-r"></i>Windows and apps ≈ 5</span><span><i class="s-x"></i>Model part in RAM '+fmt(r.cpu)+'</span></div>';
}
function gpuBarHtml(r){
 var f=r.f,v=f.vram,parts=[['s-r',f.rsv],['s-o',f.ovh],['s-k',Math.min(f.kv,Math.max(0,v-f.rsv-f.ovh))],['s-w',r.gpuW]];
 var used=parts.reduce(function(a,p){return a+p[1]},0),free=Math.max(0,v-used);
 return '<p class="note" style="margin:8px 0 2px"><b>GPU memory (VRAM)</b></p><div class="vbar-wrap"><div class="vbar" role="img" aria-label="VRAM bar">'+parts.map(function(p){return '<span class="'+p[0]+'" style="width:'+(p[1]/v*100)+'%"></span>'}).join('')+
  '<span class="s-f" style="width:'+(free/v*100)+'%"></span><i class="vmark" data-l="'+fmt(v,0)+' GB VRAM" style="left:calc(100% - 2px)"></i></div></div>'+
  '<div class="legend"><span><i class="s-w"></i>Weights on GPU '+fmt(r.gpuW)+'</span><span><i class="s-k"></i>Context cache '+fmt(f.kv)+'</span><span><i class="s-o"></i>Overhead '+fmt(f.ovh)+'</span><span><i class="s-r"></i>Windows '+fmt(f.rsv)+'</span></div>';
}
function gpuOptions(sel){return GPUS.map(function(g,i){return '<option value="'+i+'"'+(g.n===sel?' selected':'')+'>'+g.n+'</option>'}).join('')}
function tpsRange(t){return fmt(Math.max(0.1,t*0.75),t<10?1:0)+' to '+fmt(t*1.25,t<10?1:0)}
function zoneLabel(z){return z==='gpu'?'<span class="verdict v-good">Fully on GPU</span>':z==='split'?'<span class="verdict v-warn">GPU + RAM</span>':'<span class="verdict v-bad">Too big</span>'}
var DEFAULT_GPU='GTX 1650 (4 GB)';

WIDGETS.fit=function(el){
 el.innerHTML='<div class="wt"><span>VRAM + RAM fit calculator</span><span>Estimates. Confirm with nvidia-smi and Task Manager.</span></div>'+
 '<div class="wgrid">'+
 '<label>Graphics card<select id="f-g">'+gpuOptions(DEFAULT_GPU)+'</select></label>'+
 '<label>System RAM<select id="f-r">'+opts(RAMS,16,function(x){return x+' GB'})+'</select></label>'+
 '<label>Model size<select id="f-p">'+opts(SIZES,12,function(x){return x+'B parameters'})+'</select></label>'+
 '<label>Quantization<select id="f-q">'+QUANTS.map(function(q){return '<option value="'+q.b+'"'+(q.k==='Q4_K_M'?' selected':'')+'>'+q.k+'</option>'}).join('')+'</select></label>'+
 '<label>Context length<select id="f-c">'+opts(CTXS,4096,ctxLabel)+'</select></label>'+
 '<label>KV cache precision<select id="f-k"><option value="0">16-bit (default)</option><option value="1">8-bit (half the cache)</option></select></label>'+
 '<label>This GPU runs my monitor<select id="f-d"><option value="0">No (most laptops)</option><option value="1">Yes</option></select></label>'+
 '<label>RAM speed<select id="f-b"><option value="25">Single-channel / slow (≈25 GB/s)</option><option value="40" selected>Dual-channel DDR4 (≈40 GB/s)</option><option value="65">DDR5 (≈65 GB/s)</option></select></label>'+
 '</div><div id="f-out"></div>'+
 '<p class="note">Memory is in GiB (the unit nvidia-smi and Windows show). Layer counts are typical for each size class. Speeds are rough: real numbers depend on the runtime, the model and how many layers you offload. Mixture-of-experts models: enter the total parameters (they run faster than this estimate).</p>';
 var ids=['f-g','f-r','f-p','f-q','f-c','f-k','f-d','f-b'].map(function(i){return $('#'+i,el)});
 function run(){
  var G=GPUS[+ids[0].value];
  var o={vram:G.v,gbw:G.bw,ram:+ids[1].value,params:+ids[2].value,bits:+ids[3].value,ctx:+ids[4].value,kv8:ids[5].value==='1',display:ids[6].value==='1',rbw:+ids[7].value};
  var r=offloadCalc(o),h='';
  if(r.zone==='gpu'){
   var head=o.vram-r.f.total;
   h='<span class="verdict v-good">Fits fully on the GPU</span>'+gpuBarHtml(r)+
    '<p>About <b>'+fmt(head)+' GB</b> of VRAM to spare, enough for roughly <b>'+(r.f.maxCtx>=1024?Math.floor(r.f.maxCtx/1024)+'K':r.f.maxCtx)+'</b> tokens of context. Expect about <b class="num">'+tpsRange(r.tps)+'</b> tokens per second.</p>';
  }else if(r.zone==='split'){
   h='<span class="verdict v-warn">Runs with GPU + RAM offload</span>'+gpuBarHtml(r)+ramBarHtml(r,o.ram)+
    '<p>About <b>'+Math.round(r.pct*100)+'%</b> of the weights fit on the GPU. The other <b>'+fmt(r.cpu)+' GB</b> runs from system RAM on the CPU. It works, just slower: expect about <b class="num">'+tpsRange(r.tps)+'</b> tokens per second.</p>'+
    '<p>To speed it up: a lower quantization, a shorter context, the 8-bit KV cache, or a smaller model. In LM Studio set GPU Offload as high as it allows. Ollama splits automatically (<code>ollama ps</code> shows the split).</p>';
  }else{
   h='<span class="verdict v-bad">Too big for this PC</span>'+gpuBarHtml(r)+ramBarHtml(r,o.ram)+
    '<p>Needs about <b>'+fmt(r.cpu)+' GB</b> in system RAM but only about <b>'+fmt(r.ramFree)+' GB</b> is free after Windows. Windows would start swapping to disk and it would crawl. Choose a lower quantization or a smaller model.</p>';
  }
  $('#f-out',el).innerHTML='<div class="out">'+h+'</div>';
 }
 ids.forEach(function(x){x.addEventListener('change',run)});run();
};

WIDGETS.speed=function(el){
 el.innerHTML='<div class="wt"><span>Speed estimator</span><span>GPU only, or GPU + RAM</span></div>'+
 '<div class="wgrid"><label>Graphics card<select id="s-g">'+gpuOptions(DEFAULT_GPU)+'</select></label>'+
 '<label>System RAM<select id="s-r">'+opts(RAMS,16,function(x){return x+' GB'})+'</select></label>'+
 '<label>Model size<select id="s-p">'+opts(SIZES,8,function(x){return x+'B parameters'})+'</select></label>'+
 '<label>Quantization<select id="s-q">'+QUANTS.map(function(q){return '<option value="'+q.b+'"'+(q.k==='Q4_K_M'?' selected':'')+'>'+q.k+'</option>'}).join('')+'</select></label></div><div id="s-out"></div>'+
 '<p class="note">Assumes dual-channel DDR4 (about 40 GB/s), 4K context and a GPU that does not drive the monitor. Bandwidth figures are approximate.</p>';
 var g=$('#s-g',el),ram=$('#s-r',el),p=$('#s-p',el),q=$('#s-q',el);
 function run(){
  var G=GPUS[+g.value],P=+p.value,B=+q.value;
  var r=offloadCalc({vram:G.v,gbw:G.bw,ram:+ram.value,rbw:40,params:P,bits:B,ctx:4096,kv8:false,display:false});
  var ceil=G.bw/(P*B/8);
  var feel=r.tps<3?'Slow but usable for short answers':(r.tps<8?'Below reading speed':(r.tps<20?'About reading speed':(r.tps<40?'Comfortable for chat':'Feels instant')));
  var txt=r.zone==='none'?'<p>'+zoneLabel('none')+' This model does not fit in VRAM plus free RAM.</p>':
   '<p>'+zoneLabel(r.zone)+' '+(r.zone==='split'?Math.round(r.pct*100)+'% of the weights on the GPU, '+fmt(r.cpu)+' GB in RAM.':'Everything on the GPU (ceiling about '+fmt(ceil,0)+' tokens per second).')+'</p>'+
   '<p>Expect about <b class="num">'+tpsRange(r.tps)+'</b> tokens per second. Feels like: <b>'+feel+'</b>.</p>';
  $('#s-out',el).innerHTML='<div class="out">'+txt+'</div>';
 }
 [g,ram,p,q].forEach(function(x){x.addEventListener('change',run)});run();
};

WIDGETS.gpupick=function(el){
 el.innerHTML='<div class="wt"><span>What can my PC run?</span><span>Q4_K_M, 4K context, estimates</span></div>'+
 '<div class="wgrid"><label>Graphics card<select id="g-g">'+gpuOptions(DEFAULT_GPU)+'</select></label>'+
 '<label>System RAM<select id="g-r">'+opts(RAMS,16,function(x){return x+' GB'})+'</select></label></div><div id="g-out"></div>'+
 '<p class="note">"GPU + RAM" means LM Studio or Ollama puts part of the model in system RAM. It runs, but slower. Speeds assume dual-channel DDR4. Mixture-of-experts models run faster than these dense-model estimates.</p>';
 var g=$('#g-g',el),ram=$('#g-r',el);
 function run(){
  var G=GPUS[+g.value],R=+ram.value,rows='';
  [1,3,4,7,8,12,14,20,27,32,70].forEach(function(P){
   var r=offloadCalc({vram:G.v,gbw:G.bw,ram:R,rbw:40,params:P,bits:4.89,ctx:4096,kv8:false,display:false});
   rows+='<tr><td>'+P+'B</td><td class="num">'+fmt(P*4.89/8)+' GB</td><td>'+zoneLabel(r.zone)+'</td><td class="num">'+(r.zone==='none'?'–':tpsRange(r.tps))+'</td></tr>';
  });
  $('#g-out',el).innerHTML='<div class="out"><p><b>'+G.v+' GB</b> VRAM at about <b>'+G.bw+' GB/s</b>, plus <b>'+R+' GB</b> system RAM.</p>'+
   '<div class="tw" style="margin:6px 0 0"><table style="min-width:420px"><thead><tr><th>Model</th><th>File size</th><th>Where it runs</th><th>Tokens per second</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>';
 }
 [g,ram].forEach(function(x){x.addEventListener('change',run)});run();
};

WIDGETS.sampling=function(el){
 var T=[['Python',4.0],['JavaScript',2.6],['Scratch',1.2],['Java',1.1],['C',0.4],['Rust',0.2],['Go',-0.3],['banana',-2.5],['purple',-3.5]];
 el.innerHTML='<div class="wt"><span>Sampling lab</span><span>Prompt: "The best first programming language is"</span></div>'+
 '<div class="wgrid">'+
 '<label>Temperature <b id="sm-t-v"></b><input id="sm-t" type="range" min="0.1" max="2" step="0.05" value="1"></label>'+
 '<label>Top-k <b id="sm-k-v"></b><input id="sm-k" type="range" min="1" max="9" step="1" value="9"></label>'+
 '<label>Top-p <b id="sm-p-v"></b><input id="sm-p" type="range" min="0.1" max="1" step="0.05" value="1"></label>'+
 '<label>Min-p <b id="sm-m-v"></b><input id="sm-m" type="range" min="0" max="0.3" step="0.01" value="0"></label></div>'+
 '<div class="bars" id="sm-bars"></div><div style="display:flex;gap:10px;align-items:center;margin-top:12px;flex-wrap:wrap"><button class="btn sm" id="sm-go" type="button">Draw 20 samples</button><span class="note" style="margin:0">Faded rows are removed before picking. Percentages are renormalised.</span></div><div class="tally" id="sm-tally"></div>';
 var t=$('#sm-t',el),k=$('#sm-k',el),p=$('#sm-p',el),m=$('#sm-m',el),probs=[];
 function calc(){
  var temp=+t.value,mx=Math.max.apply(null,T.map(function(x){return x[1]}));
  var ex=T.map(function(x){return Math.exp((x[1]-mx)/temp)}),sum=ex.reduce(function(a,b){return a+b},0);
  var pr=ex.map(function(e){return e/sum}),idx=pr.map(function(_,i){return i}).sort(function(a,b){return pr[b]-pr[a]});
  var keep=pr.map(function(){return true});
  idx.forEach(function(i,r){if(r>=+k.value)keep[i]=false});
  var pmax=pr[idx[0]];
  idx.forEach(function(i){if(pr[i]<+m.value*pmax)keep[i]=false});
  var cum=0,cut=false;
  idx.forEach(function(i){if(!keep[i])return;if(cut){keep[i]=false;return}cum+=pr[i];if(cum>=+p.value)cut=true});
  var tot=0;pr.forEach(function(x,i){if(keep[i])tot+=x});
  probs=pr.map(function(x,i){return keep[i]?x/tot:0});
  $('#sm-t-v',el).textContent=temp.toFixed(2);$('#sm-k-v',el).textContent=(+k.value===9?'off':k.value);
  $('#sm-p-v',el).textContent=(+p.value===1?'off':(+p.value).toFixed(2));$('#sm-m-v',el).textContent=(+m.value===0?'off':(+m.value).toFixed(2));
  $('#sm-bars',el).innerHTML=T.map(function(x,i){return '<div class="brow'+(keep[i]?'':' off')+'"><span class="lbl">'+esc(x[0])+'</span><span class="track"><span class="fill" style="display:block;width:'+((keep[i]?probs[i]:pr[i])*100)+'%"></span></span><span class="pct">'+(keep[i]?(probs[i]*100).toFixed(1)+'%':'out')+'</span></div>'}).join('');
  $('#sm-tally',el).innerHTML='';
 }
 [t,k,p,m].forEach(function(x){x.addEventListener('input',calc)});
 $('#sm-go',el).addEventListener('click',function(){
  var c={},last=0;probs.forEach(function(x,i){if(x>0)last=i});
  for(var n=0;n<20;n++){var r=Math.random(),a=0,pick=last;for(var i=0;i<probs.length;i++){a+=probs[i];if(probs[i]>0&&r<=a){pick=i;break}}c[T[pick][0]]=(c[T[pick][0]]||0)+1}
  $('#sm-tally',el).innerHTML=Object.keys(c).sort(function(a,b){return c[b]-c[a]}).map(function(w){return '<span>'+esc(w)+' ×'+c[w]+'</span>'}).join('');
 });
 calc();
};

WIDGETS.glossary=function(el){
 el.innerHTML='<div class="wt"><span>Glossary</span><span id="gl-n"></span></div><div class="wgrid" style="grid-template-columns:1fr"><label>Filter<input id="gl-q" type="text" placeholder="Type a term, for example quant" autocomplete="off"></label></div><dl class="gl" id="gl-l"></dl>';
 var q=$('#gl-q',el);
 function run(){
  var s=q.value.toLowerCase().trim(),list=GLOSSARY.filter(function(x){return !s||(x[0]+' '+x[1]).toLowerCase().indexOf(s)>-1});
  $('#gl-n',el).textContent=list.length+' of '+GLOSSARY.length+' terms';
  $('#gl-l',el).innerHTML=list.map(function(x){return '<dt>'+esc(x[0])+'</dt><dd>'+esc(x[1])+'</dd>'}).join('')||'<dd>No match.</dd>';
 }
 q.addEventListener('input',run);run();
};

WIDGETS.homebar=function(el){
 var r=fitCalc({vram:12,params:9,bits:4.89,ctx:16384,kv8:false,display:true});
 el.innerHTML='<div class="wt"><span>The one picture to remember</span><span>Example: 9B model, Q4_K_M, 16K context, 12 GB card</span></div>'+barHtml(r)+
 '<p class="note" style="margin-top:4px">Everything in this course is about fitting these blocks inside the card. Lesson 3.3 lets you change the numbers.</p>';
};
