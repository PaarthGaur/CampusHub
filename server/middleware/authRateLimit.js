// Small single-process limiter; use a shared gateway limiter for multiple instances.
const attempts=new Map();
export function authRateLimit(req,res,next){
 const now=Date.now(),key=req.ip;
 let entry=attempts.get(key);
 if(!entry||entry.until<now){entry={count:0,until:now+15*60*1000};attempts.set(key,entry);}
 if(++entry.count>50){res.set('Retry-After',String(Math.ceil((entry.until-now)/1000)));return res.status(429).json({status:'fail',message:'Too many authentication attempts. Please retry in 15 minutes.'});}
 if(attempts.size>10000) for(const [ip,item] of attempts) if(item.until<now) attempts.delete(ip);
 next();
}
