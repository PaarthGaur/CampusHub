import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
const router=Router();
const active=new Set();
router.post('/',protect,catchAsync(async(req,res,next)=>{
 if(!process.env.AI_API_KEY || !process.env.AI_BASE_URL || !process.env.AI_MODEL) return next(new AppError('AI is not configured. Set AI_BASE_URL, AI_MODEL and AI_API_KEY on the server.',503));
 const messages=req.body.messages;
 if(!Array.isArray(messages)||!messages.length||messages.length>20||messages.some(m=>!m || typeof m !== 'object' || !['user','assistant'].includes(m.role)||typeof m.content!=='string'||!m.content.trim()||m.content.length>4000)) return next(new AppError('Send 1–20 messages of at most 4000 characters.',400));
 const id=String(req.user._id);
 if(active.has(id)) return next(new AppError('Please wait for your current AI reply.',429));
 active.add(id);
 try {
  const response=await fetch(process.env.AI_BASE_URL.replace(/\/$/,'')+'/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+process.env.AI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.AI_MODEL,messages:[{role:'system',content:'You are CampusHub, a helpful academic study assistant. Do not claim access to files or course materials that were not provided.'},...messages],max_tokens:1000}),signal:AbortSignal.timeout(30000)});
  if(!response.ok) return next(new AppError('AI provider rejected the request. Check provider credentials, model and quota.',502));
  const data=await response.json(); const reply=data.choices?.[0]?.message?.content;
  if(typeof reply!=='string'||!reply.trim()) return next(new AppError('AI provider returned an invalid response.',502));
  res.json({status:'success',data:{reply}});
 } catch(err) { return next(new AppError(err.name==='TimeoutError'?'AI request timed out. Please retry.':'AI provider is unavailable.',502)); }
 finally {active.delete(id);}
}));
export default router;
