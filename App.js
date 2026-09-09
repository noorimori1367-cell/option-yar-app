
import React, {useEffect, useMemo, useState} from 'react';
import {
  SafeAreaView, View, Text, ScrollView, Pressable, StyleSheet,
  StatusBar, I18nManager, Image, ActivityIndicator, TextInput
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Font from 'expo-font';
import { chapters } from './src/course';

I18nManager.allowRTL(true);
const STORAGE_KEY='option-yar-progress-v5';
const fa=n=>String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);

function Card({children,onPress,style}) {
  if(onPress) return <Pressable onPress={onPress} style={({pressed})=>[styles.card,style,pressed&&{opacity:.83}]}>{children}</Pressable>;
  return <View style={[styles.card,style]}>{children}</View>;
}
function normCdf(x){
  const t=1/(1+0.2316419*Math.abs(x));
  const d=0.3989423*Math.exp(-x*x/2);
  let p=1-d*t*(0.3193815+t*(-0.3565638+t*(1.781478+t*(-1.821256+t*1.330274))));
  return x>=0?p:1-p;
}
function bs(S,K,T,r,sigma,q,type){
  if(!(S>0&&K>0&&T>0&&sigma>0)) return null;
  const d1=(Math.log(S/K)+(r-q+0.5*sigma*sigma)*T)/(sigma*Math.sqrt(T));
  const d2=d1-sigma*Math.sqrt(T);
  const Nd1=normCdf(type==='call'?d1:-d1), Nd2=normCdf(type==='call'?d2:-d2);
  const discR=Math.exp(-r*T), discQ=Math.exp(-q*T);
  const price=type==='call' ? S*discQ*normCdf(d1)-K*discR*normCdf(d2) : K*discR*normCdf(-d2)-S*discQ*normCdf(-d1);
  const pdf=0.3989422804*Math.exp(-0.5*d1*d1);
  const delta=type==='call'?discQ*normCdf(d1):discQ*(normCdf(d1)-1);
  const gamma=discQ*pdf/(S*sigma*Math.sqrt(T));
  const vega=S*discQ*pdf*Math.sqrt(T)/100;
  const thetaCore=-(S*discQ*pdf*sigma)/(2*Math.sqrt(T));
  const theta=(type==='call'
    ? thetaCore-r*K*discR*normCdf(d2)+q*S*discQ*normCdf(d1)
    : thetaCore+r*K*discR*normCdf(-d2)-q*S*discQ*normCdf(-d1))/365;
  const rho=(type==='call'?K*T*discR*normCdf(d2):-K*T*discR*normCdf(-d2))/100;
  return {price,delta,gamma,vega,theta,rho};
}

export default function App(){
 const [ready,setReady]=useState(false),[fonts,setFonts]=useState(false);
 const [screen,setScreen]=useState({name:'home'}),[done,setDone]=useState({}),[answers,setAnswers]=useState({});
 const [lab,setLab]=useState({S:'10000',K:'10500',days:'45',iv:'35',r:'30',q:'0',type:'call'});
 useEffect(()=>{(async()=>{
   try{
     await Font.loadAsync({
       Sahel: require('./assets/fonts/Sahel.ttf'),
       SahelBold: require('./assets/fonts/Sahel-Bold.ttf')
     }); setFonts(true);
   }catch(e){ setFonts(false); }
   try{const raw=await AsyncStorage.getItem(STORAGE_KEY); if(raw)setDone(JSON.parse(raw));}catch{}
   setReady(true);
 })()},[]);
 const F=fonts?'Sahel':undefined, FB=fonts?'SahelBold':undefined;
 const all=useMemo(()=>chapters.flatMap(c=>c.lessons),[]);
 const completed=all.filter(l=>done[l.id]).length, progress=Math.round(completed/all.length*100);
 const save=async n=>{setDone(n);try{await AsyncStorage.setItem(STORAGE_KEY,JSON.stringify(n))}catch{}};
 const Header=({title,back})=><View style={styles.header}>
   <Pressable onPress={()=>setScreen(back||{name:'home'})}><Text style={styles.back}>‹</Text></Pressable>
   <Text style={[styles.headerTitle,{fontFamily:FB}]}>{title}</Text><View style={{width:30}}/>
 </View>;
 if(!ready)return <SafeAreaView style={styles.loading}><ActivityIndicator/><Text style={{fontFamily:F}}>در حال آماده‌سازی…</Text></SafeAreaView>;

 if(screen.name==='lab'){
   const x=bs(+lab.S,+lab.K,+lab.days/365,+lab.r/100,+lab.iv/100,+lab.q/100,lab.type);
   return <SafeAreaView style={styles.safe}><Header title="آزمایشگاه بلک–شولز"/>
    <ScrollView contentContainerStyle={styles.pad}>
     <Card style={styles.blueCard}><Text style={[styles.body,{fontFamily:F}]}>ورودی‌ها را تغییر بده و اثر آن‌ها را روی ارزش نظری و Greeks ببین. این ابزار آموزشی است و قیمت قطعی یا سیگنال معامله نیست.</Text></Card>
     {[['S','قیمت دارایی پایه'],['K','قیمت اعمال'],['days','روز تا سررسید'],['iv','نوسان ضمنی (%)'],['r','نرخ بدون ریسک (%)'],['q','بازده نقدی (%)']].map(([k,t])=>
       <View key={k} style={styles.inputWrap}><Text style={[styles.inputLabel,{fontFamily:FB}]}>{t}</Text><TextInput value={lab[k]} onChangeText={v=>setLab({...lab,[k]:v})} keyboardType="decimal-pad" style={[styles.input,{fontFamily:F}]}/></View>)}
     <View style={styles.segment}>
       <Pressable style={[styles.segBtn,lab.type==='call'&&styles.segOn]} onPress={()=>setLab({...lab,type:'call'})}><Text style={[styles.segText,{fontFamily:FB}]}>Call</Text></Pressable>
       <Pressable style={[styles.segBtn,lab.type==='put'&&styles.segOn]} onPress={()=>setLab({...lab,type:'put'})}><Text style={[styles.segText,{fontFamily:FB}]}>Put</Text></Pressable>
     </View>
     {x&&<Card style={styles.greenCard}>
       <Text style={[styles.big,{fontFamily:FB}]}>ارزش نظری: {fa(x.price.toFixed(2))}</Text>
       <Text style={[styles.body,{fontFamily:F}]}>Delta: {fa(x.delta.toFixed(3))}</Text>
       <Text style={[styles.body,{fontFamily:F}]}>Gamma: {fa(x.gamma.toFixed(5))}</Text>
       <Text style={[styles.body,{fontFamily:F}]}>Theta روزانه: {fa(x.theta.toFixed(2))}</Text>
       <Text style={[styles.body,{fontFamily:F}]}>Vega: {fa(x.vega.toFixed(2))}</Text>
       <Text style={[styles.body,{fontFamily:F}]}>Rho: {fa(x.rho.toFixed(2))}</Text>
     </Card>}
     <Text style={[styles.disclaimer,{fontFamily:F}]}>الهام آموزشی از آزمایشگاه قیمت‌گذاری بامبو؛ محاسبات داخل اپ مستقل انجام می‌شود.</Text>
    </ScrollView>
   </SafeAreaView>
 }

 if(screen.name==='chapter'){
   const ch=chapters.find(c=>c.id===screen.id), n=ch.lessons.filter(l=>done[l.id]).length;
   return <SafeAreaView style={styles.safe}><Header title={ch.title}/>
    <ScrollView contentContainerStyle={styles.pad}>
     <Card style={styles.progressCard}><Text style={[styles.progressTitle,{fontFamily:FB}]}>پیشرفت فصل: {fa(n)} از {fa(ch.lessons.length)}</Text><View style={styles.track}><View style={[styles.fill,{width:`${n/ch.lessons.length*100}%`}]} /></View></Card>
     {ch.lessons.map((l,i)=><Card key={l.id} onPress={()=>setScreen({name:'lesson',chapter:ch.id,id:l.id})}>
       <View style={styles.row}><View style={[styles.check,done[l.id]&&styles.checkDone]}><Text style={[styles.checkText,{fontFamily:FB}]}>{done[l.id]?'✓':fa(i+1)}</Text></View>
       <View style={{flex:1}}><Text style={[styles.title,{fontFamily:FB}]}>{l.title}</Text><Text style={[styles.sub,{fontFamily:F}]}>آموزش مفصل + مثال + نکات بازار ایران + تمرین اختصاصی</Text></View></View>
     </Card>)}
     <Pressable style={styles.primary} onPress={()=>setScreen({name:'quiz',id:ch.id})}><Text style={[styles.primaryText,{fontFamily:FB}]}>تمرین پایان فصل</Text></Pressable>
    </ScrollView></SafeAreaView>
 }

 if(screen.name==='lesson'){
   const ch=chapters.find(c=>c.id===screen.chapter), l=ch.lessons.find(x=>x.id===screen.id), d=l.deep||{}, q=l.check, selected=answers[l.id];
   const layers=d.intro_layers||[`برای فهم «${l.title}» اول مسئله‌ای که حل می‌کند را ببین.`,l.body,'این مفهوم باید در سناریوهای مختلف بررسی شود.'];
   return <SafeAreaView style={styles.safe}><Header title={l.title} back={{name:'chapter',id:ch.id}}/>
    <ScrollView contentContainerStyle={styles.pad}>
     <Text style={[styles.section,{fontFamily:FB}]}>۱. مفهوم اصلی — از صفر</Text>
     <Card><Text style={[styles.miniTitle,{fontFamily:FB}]}>اول با زبان خیلی ساده</Text><Text style={[styles.body,{fontFamily:F}]}>{layers[0]}</Text></Card>
     <Card><Text style={[styles.miniTitle,{fontFamily:FB}]}>حالا دقیق‌تر</Text><Text style={[styles.body,{fontFamily:F}]}>{d.concept||l.body}</Text><Text style={[styles.body,{fontFamily:F,marginTop:12}]}>{layers[1]}</Text></Card>
     <Card style={styles.blueCard}><Text style={[styles.miniTitle,{fontFamily:FB}]}>چرا برای معامله‌گر مهم است؟</Text><Text style={[styles.body,{fontFamily:F}]}>{layers[2]}</Text></Card>

     {(l.bambo_sections||[]).length>0&&<>
       <Text style={[styles.section,{fontFamily:FB}]}>۲. تکمیل آموزش با نکات بازار آپشن ایران</Text>
       {l.bambo_sections.map((s,i)=><Card key={i} style={i%3===0?styles.greenCard:i%3===1?styles.example:undefined}>
         <Text style={[styles.miniTitle,{fontFamily:FB}]}>{s.title}</Text><Text style={[styles.body,{fontFamily:F}]}>{s.text}</Text>
       </Card>)}
     </>}

     <Text style={[styles.section,{fontFamily:FB}]}>۳. منطق و مکانیزم</Text>
     <Card><Text style={[styles.body,{fontFamily:F}]}>{d.mechanics||l.body}</Text></Card>
     <Text style={[styles.section,{fontFamily:FB}]}>۴. مثال عددی</Text>
     <Card style={styles.example}><Text style={[styles.body,{fontFamily:F}]}>{d.example||l.example}</Text></Card>
     <Text style={[styles.section,{fontFamily:FB}]}>۵. نکته عملی معامله‌گر</Text>
     <Card style={styles.greenCard}><Text style={[styles.body,{fontFamily:F}]}>{d.practical||'قبل از معامله، سناریوی ورود و خروج را مشخص کن.'}</Text></Card>
     <Text style={[styles.section,{fontFamily:FB}]}>۶. ریسک‌ها</Text>
     <Card style={styles.redCard}><Text style={[styles.body,{fontFamily:F}]}>{d.risk||'ریسک موقعیت، زمان، نقدشوندگی و سناریوی بدبینانه را بررسی کن.'}</Text></Card>
     <Text style={[styles.section,{fontFamily:FB}]}>۷. دام رایج</Text>
     <Card><Text style={[styles.body,{fontFamily:F}]}>{d.mistake||'تصمیم‌گیری فقط بر اساس Premium یا آخرین قیمت.'}</Text></Card>
     <Text style={[styles.section,{fontFamily:FB}]}>۸. سؤال فوری همین درس</Text>
     <Card><Text style={[styles.title,{fontFamily:FB}]}>{q.question}</Text>
       {q.options.map((o,i)=><Pressable key={i} style={[styles.option,selected===i&&styles.optionOn]} onPress={()=>setAnswers({...answers,[l.id]:i})}><Text style={[styles.optionText,{fontFamily:F}]}>{o}</Text></Pressable>)}
       {selected!==undefined&&<Text style={[styles.feedback,{fontFamily:F,color:selected===q.answer?'#16865B':'#C33F50'}]}>{selected===q.answer?'✓ درست':'✕ نادرست'} — {q.explanation}</Text>}
     </Card>
     <Pressable style={[styles.primary,done[l.id]&&styles.doneBtn]} onPress={()=>save({...done,[l.id]:!done[l.id]})}><Text style={[styles.primaryText,{fontFamily:FB}]}>{done[l.id]?'✓ یاد گرفتم — لغو تیک':'این درس را یاد گرفتم'}</Text></Pressable>
     {(l.references||[]).length>0&&<Text style={[styles.disclaimer,{fontFamily:F}]}>منابع تکمیلی: بامبو فاند + منابع پایه Cboe/OIC. مطالب برای آموزش آپشن‌یار بازنویسی شده‌اند.</Text>}
    </ScrollView></SafeAreaView>
 }

 if(screen.name==='quiz'){
   const ch=chapters.find(c=>c.id===screen.id),key='chapter-'+ch.id,ans=answers[key]||{},score=ch.quiz.filter((q,i)=>ans[i]===q.a).length;
   return <SafeAreaView style={styles.safe}><Header title="تمرین پایان فصل" back={{name:'chapter',id:ch.id}}/><ScrollView contentContainerStyle={styles.pad}>
    {ch.quiz.map((q,qi)=><Card key={qi}><Text style={[styles.title,{fontFamily:FB}]}>{fa(qi+1)}. {q.q}</Text>{q.opts.map((o,i)=><Pressable key={i} style={[styles.option,ans[qi]===i&&styles.optionOn]} onPress={()=>setAnswers({...answers,[key]:{...ans,[qi]:i}})}><Text style={[styles.optionText,{fontFamily:F}]}>{o}</Text></Pressable>)}</Card>)}
    <Card style={styles.greenCard}><Text style={[styles.big,{fontFamily:FB}]}>امتیاز: {fa(score)} از {fa(ch.quiz.length)}</Text><Text style={[styles.sub,{fontFamily:F}]}>{score/ch.quiz.length>=.7?'این فصل را خوب فهمیدی.':'بهتر است بخش‌های اشتباه را مرور کنی.'}</Text></Card>
   </ScrollView></SafeAreaView>
 }

 return <SafeAreaView style={styles.safe}><StatusBar barStyle="light-content"/><ScrollView contentContainerStyle={styles.pad}>
   <View style={styles.hero}><Image source={require('./assets/icon.png')} style={styles.logo}/><Text style={[styles.heroTitle,{fontFamily:FB}]}>آپشن‌یار</Text><Text style={[styles.heroSub,{fontFamily:F}]}>همان مسیر قبلی؛ حالا با آموزش عمیق‌تر بازار آپشن ایران</Text><Text style={[styles.heroProgress,{fontFamily:FB}]}>{fa(progress)}٪ تکمیل شده</Text><View style={styles.track}><View style={[styles.fill,{width:`${progress}%`}]} /></View></View>
   <Card onPress={()=>setScreen({name:'lab'})} style={styles.labCard}><Text style={[styles.title,{fontFamily:FB}]}>🧪 آزمایشگاه بلک–شولز</Text><Text style={[styles.sub,{fontFamily:F}]}>قیمت نظری و Greeks را با تغییر ورودی‌ها تمرین کن.</Text></Card>
   {chapters.map(ch=>{const n=ch.lessons.filter(l=>done[l.id]).length;return <Card key={ch.id} onPress={()=>setScreen({name:'chapter',id:ch.id})}><Text style={[styles.title,{fontFamily:FB}]}>{ch.title}</Text><Text style={[styles.sub,{fontFamily:F}]}>{ch.subtitle}</Text><Text style={[styles.counter,{fontFamily:FB}]}>{fa(n)} / {fa(ch.lessons.length)} درس</Text></Card>})}
   <Text style={[styles.disclaimer,{fontFamily:F}]}>آموزشی است؛ توصیه خرید و فروش نیست. جزئیات اجرایی بازار ایران را با آخرین مشخصات قرارداد و دستورالعمل رسمی تطبیق بده.</Text>
 </ScrollView></SafeAreaView>
}

const styles=StyleSheet.create({
 safe:{flex:1,backgroundColor:'#F4F7FA'},loading:{flex:1,alignItems:'center',justifyContent:'center',gap:12},
 pad:{padding:16,paddingBottom:50},hero:{backgroundColor:'#102A43',borderRadius:26,padding:22,alignItems:'center',marginBottom:14},
 logo:{width:120,height:120,resizeMode:'contain'},heroTitle:{fontSize:30,color:'#FFF',marginTop:4,textAlign:'center',writingDirection:'rtl'},
 heroSub:{fontSize:15,color:'#D7E2ED',lineHeight:28,textAlign:'center',writingDirection:'rtl'},heroProgress:{fontSize:18,color:'#67D7A5',alignSelf:'stretch',textAlign:'right',marginTop:14},
 card:{backgroundColor:'#FFF',borderRadius:18,padding:17,borderWidth:1,borderColor:'#E2E8EF',marginBottom:12},
 progressCard:{backgroundColor:'#EDF3FF'},labCard:{backgroundColor:'#EEF8F7',borderColor:'#C7E8E4'},
 title:{fontSize:17,color:'#102A43',textAlign:'right',writingDirection:'rtl',lineHeight:29},miniTitle:{fontSize:16,color:'#102A43',textAlign:'right',writingDirection:'rtl',marginBottom:8},
 sub:{fontSize:13,color:'#718397',textAlign:'right',writingDirection:'rtl',lineHeight:24,marginTop:4},counter:{fontSize:13,color:'#246BFD',textAlign:'right',marginTop:10},
 row:{flexDirection:'row-reverse',gap:12,alignItems:'center'},check:{width:38,height:38,borderRadius:19,backgroundColor:'#EDF1F5',alignItems:'center',justifyContent:'center'},
 checkDone:{backgroundColor:'#31B67E'},checkText:{color:'#5D7288'},header:{minHeight:64,paddingHorizontal:16,paddingVertical:10,backgroundColor:'#FFF',borderBottomWidth:1,borderColor:'#E2E8EF',flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between'},
 headerTitle:{fontSize:17,color:'#102A43',textAlign:'center',writingDirection:'rtl',maxWidth:'80%'},back:{fontSize:34,color:'#246BFD'},
 section:{fontSize:15,color:'#168E91',textAlign:'right',writingDirection:'rtl',marginTop:9,marginBottom:7},
 body:{fontSize:16,color:'#263E55',lineHeight:32,textAlign:'right',writingDirection:'rtl'},blueCard:{backgroundColor:'#F1F7FF',borderColor:'#D8E7FF'},
 example:{backgroundColor:'#FFF8E8',borderColor:'#F0DBA5'},greenCard:{backgroundColor:'#EEF9F4',borderColor:'#CBEBDD'},redCard:{backgroundColor:'#FFF1F2',borderColor:'#F2C9CE'},
 option:{borderWidth:1,borderColor:'#DBE3EA',borderRadius:13,padding:13,marginTop:9},optionOn:{backgroundColor:'#EDF3FF',borderColor:'#246BFD'},
 optionText:{fontSize:14,color:'#263E55',lineHeight:24,textAlign:'right',writingDirection:'rtl'},feedback:{fontSize:13,lineHeight:24,textAlign:'right',writingDirection:'rtl',marginTop:12},
 primary:{backgroundColor:'#246BFD',borderRadius:15,padding:15,alignItems:'center',marginTop:5,marginBottom:13},doneBtn:{backgroundColor:'#31B67E'},primaryText:{fontSize:16,color:'#FFF'},
 progressTitle:{fontSize:16,color:'#102A43',textAlign:'right',writingDirection:'rtl'},track:{height:9,backgroundColor:'#D7DEE6',borderRadius:99,overflow:'hidden',marginTop:9,width:'100%'},
 fill:{height:'100%',backgroundColor:'#31B67E',borderRadius:99},disclaimer:{fontSize:12,color:'#7A8A99',lineHeight:23,textAlign:'center',writingDirection:'rtl',marginTop:8},
 inputWrap:{marginBottom:10},inputLabel:{fontSize:13,color:'#334E68',textAlign:'right',writingDirection:'rtl',marginBottom:5},
 input:{backgroundColor:'#FFF',borderWidth:1,borderColor:'#DCE4EC',borderRadius:12,padding:12,textAlign:'right',fontSize:15},
 segment:{flexDirection:'row-reverse',gap:8,marginVertical:10},segBtn:{flex:1,padding:12,borderRadius:12,backgroundColor:'#E7ECF2',alignItems:'center'},segOn:{backgroundColor:'#A8DDD8'},segText:{color:'#17324D'},
 big:{fontSize:20,color:'#102A43',textAlign:'right',writingDirection:'rtl',marginBottom:8}
});
