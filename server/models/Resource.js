import mongoose from 'mongoose';
const schema=new mongoose.Schema({ owner:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},fileName:{type:String,required:true,unique:true},originalName:String,fileSize:Number,mimetype:String },{timestamps:true});
export const Resource=mongoose.model('Resource',schema);
