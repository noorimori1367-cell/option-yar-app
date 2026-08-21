
import React, {useEffect, useMemo, useState} from 'react';
import {
  SafeAreaView, View, Text, ScrollView, Pressable, StyleSheet,
  StatusBar, I18nManager, Image, ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Font from 'expo-font';
import { chapters } from './src/course';

I18nManager.allowRTL(true);

const STORAGE_KEY = 'option-yar-progress-v3';
const SAHEL_URL = 'https://raw.githubusercontent.com/rastikerdar/sahel-font/master/dist/Sahel.ttf';
const SAHEL_BOLD_URL = 'https://raw.githubusercontent.com/rastikerdar/sahel-font/master/dist/Sahel-Bold.ttf';

const fa = (n) => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);

function Card({children, onPress, style}) {
  if (onPress) {
    return <Pressable onPress={onPress} style={({pressed}) => [styles.card, style, pressed && {opacity:.82}]}>{children}</Pressable>;
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [fontsOk, setFontsOk] = useState(false);
  const [screen, setScreen] = useState({name:'home'});
  const [done, setDone] = useState({});
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    (async () => {
      try {
        await Font.loadAsync({
          Sahel: {uri: SAHEL_URL},
          SahelBold: {uri: SAHEL_BOLD_URL},
        });
        setFontsOk(true);
      } catch (e) {
        setFontsOk(false);
      }
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setDone(JSON.parse(raw));
      } catch {}
      setReady(true);
    })();
  }, []);

  const font = fontsOk ? 'Sahel' : undefined;
  const fontBold = fontsOk ? 'SahelBold' : undefined;
  const allLessons = useMemo(() => chapters.flatMap(c => c.lessons), []);
  const completed = allLessons.filter(l => done[l.id]).length;
  const progress = Math.round((completed / allLessons.length) * 100);

  const saveDone = async (next) => {
    setDone(next);
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const toggle = (id) => saveDone({...done, [id]: !done[id]});

  if (!ready) {
    return <SafeAreaView style={styles.loading}><ActivityIndicator/><Text style={{fontFamily:font}}>در حال آماده‌سازی آپشن‌یار…</Text></SafeAreaView>;
  }

  const Header = ({title, backTo}) => (
    <View style={styles.header}>
      <Pressable onPress={() => setScreen(backTo || {name:'home'})}><Text style={styles.back}>‹</Text></Pressable>
      <Text numberOfLines={2} style={[styles.headerTitle,{fontFamily:fontBold}]}>{title}</Text>
      <View style={{width:28}}/>
    </View>
  );

  if (screen.name === 'chapter') {
    const ch = chapters.find(c => c.id === screen.id);
    const n = ch.lessons.filter(l => done[l.id]).length;
    return <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content"/>
      <Header title={ch.title}/>
      <ScrollView contentContainerStyle={styles.pad}>
        <Card style={styles.progressCard}>
          <Text style={[styles.progressTitle,{fontFamily:fontBold}]}>پیشرفت فصل: {fa(n)} از {fa(ch.lessons.length)}</Text>
          <View style={styles.progressTrack}><View style={[styles.progressFill,{width:`${n/ch.lessons.length*100}%`}]} /></View>
        </Card>
        {ch.lessons.map((l,i) => (
          <Card key={l.id} onPress={() => setScreen({name:'lesson', chapter:ch.id, id:l.id})}>
            <View style={styles.row}>
              <View style={[styles.check, done[l.id] && styles.checkDone]}>
                <Text style={[styles.checkText,{fontFamily:fontBold}]}>{done[l.id] ? '✓' : fa(i+1)}</Text>
              </View>
              <View style={{flex:1}}>
                <Text style={[styles.title,{fontFamily:fontBold}]}>{l.title}</Text>
                <Text style={[styles.sub,{fontFamily:font}]}>مفهوم از صفر + مثال + ریسک + دام رایج + تمرین</Text>
              </View>
            </View>
          </Card>
        ))}
        <Pressable style={styles.primary} onPress={() => setScreen({name:'quiz', id:ch.id})}>
          <Text style={[styles.primaryText,{fontFamily:fontBold}]}>تمرین پایان فصل</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>;
  }

  if (screen.name === 'lesson') {
    const ch = chapters.find(c => c.id === screen.chapter);
    const l = ch.lessons.find(x => x.id === screen.id);
    const d = l.deep || {};
    const layers = d.intro_layers || [
      `برای فهم «${l.title}» اول باید مسئله‌ای که حل می‌کند را بفهمیم.`,
      l.body,
      'این مفهوم را باید در سه سناریوی صعودی، خنثی و نزولی بررسی کرد.'
    ];
    const q = l.check;
    const selected = answers[l.id];

    return <SafeAreaView style={styles.safe}>
      <Header title={l.title} backTo={{name:'chapter', id:ch.id}}/>
      <ScrollView contentContainerStyle={styles.pad}>
        <Text style={[styles.section,{fontFamily:fontBold}]}>۱. مفهوم اصلی — از صفر</Text>
        <Card>
          <Text style={[styles.miniTitle,{fontFamily:fontBold}]}>اول با زبان خیلی ساده</Text>
          <Text style={[styles.body,{fontFamily:font}]}>{layers[0]}</Text>
        </Card>
        <Card>
          <Text style={[styles.miniTitle,{fontFamily:fontBold}]}>حالا دقیق‌تر</Text>
          <Text style={[styles.body,{fontFamily:font}]}>{d.concept || l.body}</Text>
          <Text style={[styles.body,{fontFamily:font,marginTop:12}]}>{layers[1]}</Text>
        </Card>
        <Card style={styles.blueCard}>
          <Text style={[styles.miniTitle,{fontFamily:fontBold}]}>چرا برای معامله‌گر مهم است؟</Text>
          <Text style={[styles.body,{fontFamily:font}]}>{layers[2]}</Text>
        </Card>

        <Text style={[styles.section,{fontFamily:fontBold}]}>۲. منطق و مکانیزم</Text>
        <Card><Text style={[styles.body,{fontFamily:font}]}>{d.mechanics || l.body}</Text></Card>

        <Text style={[styles.section,{fontFamily:fontBold}]}>۳. مثال عددی</Text>
        <Card style={styles.example}><Text style={[styles.body,{fontFamily:font}]}>{d.example || l.example}</Text></Card>

        <Text style={[styles.section,{fontFamily:fontBold}]}>۴. نکته عملی معامله‌گر</Text>
        <Card style={styles.greenCard}><Text style={[styles.body,{fontFamily:font}]}>{d.practical}</Text></Card>

        <Text style={[styles.section,{fontFamily:fontBold}]}>۵. ریسک‌ها</Text>
        <Card style={styles.redCard}><Text style={[styles.body,{fontFamily:font}]}>{d.risk}</Text></Card>

        <Text style={[styles.section,{fontFamily:fontBold}]}>۶. دام رایج</Text>
        <Card><Text style={[styles.body,{fontFamily:font}]}>{d.mistake}</Text></Card>

        <Text style={[styles.section,{fontFamily:fontBold}]}>۷. چک‌لیست یادگیری</Text>
        <Card>
          {(d.checklist || []).map((x,i) => <Text key={i} style={[styles.body,{fontFamily:font}]}>• {x}</Text>)}
        </Card>

        <Text style={[styles.section,{fontFamily:fontBold}]}>۸. سؤال فوری</Text>
        <Card>
          <Text style={[styles.title,{fontFamily:fontBold}]}>{q.question}</Text>
          {q.options.map((o,i) => (
            <Pressable key={i} style={[styles.option, selected===i && styles.optionSelected]} onPress={() => setAnswers({...answers,[l.id]:i})}>
              <Text style={[styles.optionText,{fontFamily:font}]}>{o}</Text>
            </Pressable>
          ))}
          {selected !== undefined && (
            <Text style={[styles.feedback,{fontFamily:font,color:selected===q.answer?'#16865B':'#C33F50'}]}>
              {selected===q.answer?'✓ درست':'✕ نادرست'} — {q.explanation}
            </Text>
          )}
        </Card>

        <Pressable style={[styles.primary, done[l.id] && styles.doneButton]} onPress={() => toggle(l.id)}>
          <Text style={[styles.primaryText,{fontFamily:fontBold}]}>{done[l.id]?'✓ یاد گرفتم — لغو تیک':'این درس را یاد گرفتم'}</Text>
        </Pressable>

        <Text style={[styles.disclaimer,{fontFamily:font}]}>
          منابع پایه: Cboe Options Institute و Options Industry Council (OIC). جزئیات اجرایی بازار ایران باید با آخرین دستورالعمل رسمی تطبیق داده شود.
        </Text>
      </ScrollView>
    </SafeAreaView>;
  }

  if (screen.name === 'quiz') {
    const ch = chapters.find(c => c.id === screen.id);
    const key = `chapter-${ch.id}`;
    const ans = answers[key] || {};
    const score = ch.quiz.filter((q,i) => ans[i] === q.a).length;
    return <SafeAreaView style={styles.safe}>
      <Header title="تمرین پایان فصل" backTo={{name:'chapter',id:ch.id}}/>
      <ScrollView contentContainerStyle={styles.pad}>
        {ch.quiz.map((q,qi) => (
          <Card key={qi}>
            <Text style={[styles.title,{fontFamily:fontBold}]}>{fa(qi+1)}. {q.q}</Text>
            {q.opts.map((o,i) => (
              <Pressable key={i} style={[styles.option, ans[qi]===i && styles.optionSelected]}
                onPress={() => setAnswers({...answers,[key]:{...ans,[qi]:i}})}>
                <Text style={[styles.optionText,{fontFamily:font}]}>{o}</Text>
              </Pressable>
            ))}
          </Card>
        ))}
        <Card style={styles.greenCard}>
          <Text style={[styles.progressTitle,{fontFamily:fontBold}]}>امتیاز: {fa(score)} از {fa(ch.quiz.length)}</Text>
          <Text style={[styles.sub,{fontFamily:font}]}>
            {score/ch.quiz.length >= .7 ? 'خوبه؛ می‌توانی وارد فصل بعد شوی.' : 'بهتر است درس‌های این فصل را دوباره مرور کنی.'}
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>;
  }

  return <SafeAreaView style={styles.safe}>
    <StatusBar barStyle="light-content"/>
    <ScrollView contentContainerStyle={styles.pad}>
      <View style={styles.hero}>
        <Image source={require('./assets/icon.png')} style={styles.logo}/>
        <Text style={[styles.heroTitle,{fontFamily:fontBold}]}>آپشن‌یار</Text>
        <Text style={[styles.heroSub,{fontFamily:font}]}>آموزش اختیار معامله از صفر تا استراتژی‌های ترکیبی</Text>
        <Text style={[styles.heroProgress,{fontFamily:fontBold}]}>{fa(progress)}٪ تکمیل شده</Text>
        <View style={styles.progressTrack}><View style={[styles.progressFill,{width:`${progress}%`}]} /></View>
      </View>

      {chapters.map(ch => {
        const n = ch.lessons.filter(l => done[l.id]).length;
        return <Card key={ch.id} onPress={() => setScreen({name:'chapter',id:ch.id})}>
          <Text style={[styles.title,{fontFamily:fontBold}]}>{ch.title}</Text>
          <Text style={[styles.sub,{fontFamily:font}]}>{ch.subtitle}</Text>
          <Text style={[styles.counter,{fontFamily:fontBold}]}>{fa(n)} / {fa(ch.lessons.length)} درس</Text>
        </Card>;
      })}

      <Text style={[styles.disclaimer,{fontFamily:font}]}>
        این نرم‌افزار آموزشی است و سیگنال یا توصیه سرمایه‌گذاری ارائه نمی‌کند. بازار اختیار معامله ریسک قابل‌توجه دارد.
      </Text>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#F4F7FA'},
  loading:{flex:1,alignItems:'center',justifyContent:'center',gap:12},
  pad:{padding:16,paddingBottom:48},
  hero:{backgroundColor:'#102A43',borderRadius:26,padding:22,alignItems:'center',marginBottom:14},
  logo:{width:132,height:132,resizeMode:'contain'},
  heroTitle:{fontSize:30,color:'#FFF',marginTop:4,textAlign:'center'},
  heroSub:{fontSize:15,color:'#D7E2ED',lineHeight:28,textAlign:'center',marginTop:6},
  heroProgress:{fontSize:19,color:'#67D7A5',alignSelf:'stretch',textAlign:'right',marginTop:15},
  progressTrack:{height:9,backgroundColor:'#D7DEE6',borderRadius:99,overflow:'hidden',marginTop:9,width:'100%'},
  progressFill:{height:'100%',backgroundColor:'#31B67E',borderRadius:99},
  card:{backgroundColor:'#FFF',borderRadius:18,padding:17,borderWidth:1,borderColor:'#E2E8EF',marginBottom:12},
  progressCard:{backgroundColor:'#EDF3FF'},
  title:{fontSize:17,color:'#102A43',textAlign:'right',lineHeight:29},
  miniTitle:{fontSize:16,color:'#102A43',textAlign:'right',marginBottom:8},
  sub:{fontSize:13,color:'#718397',textAlign:'right',lineHeight:24,marginTop:4},
  counter:{fontSize:13,color:'#246BFD',textAlign:'right',marginTop:10},
  row:{flexDirection:'row-reverse',gap:12,alignItems:'center'},
  check:{width:38,height:38,borderRadius:19,backgroundColor:'#EDF1F5',alignItems:'center',justifyContent:'center'},
  checkDone:{backgroundColor:'#31B67E'},
  checkText:{color:'#5D7288'},
  header:{height:64,paddingHorizontal:16,backgroundColor:'#FFF',borderBottomWidth:1,borderColor:'#E2E8EF',flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between'},
  headerTitle:{fontSize:17,color:'#102A43',textAlign:'center',maxWidth:'80%'},
  back:{fontSize:34,color:'#246BFD'},
  section:{fontSize:15,color:'#246BFD',textAlign:'right',marginTop:8,marginBottom:7},
  body:{fontSize:16,color:'#263E55',lineHeight:32,textAlign:'right'},
  blueCard:{backgroundColor:'#F1F7FF',borderColor:'#D8E7FF'},
  example:{backgroundColor:'#FFF8E8',borderColor:'#F0DBA5'},
  greenCard:{backgroundColor:'#EEF9F4',borderColor:'#CBEBDD'},
  redCard:{backgroundColor:'#FFF1F2',borderColor:'#F2C9CE'},
  option:{borderWidth:1,borderColor:'#DBE3EA',borderRadius:13,padding:13,marginTop:9},
  optionSelected:{backgroundColor:'#EDF3FF',borderColor:'#246BFD'},
  optionText:{fontSize:14,color:'#263E55',lineHeight:24,textAlign:'right'},
  feedback:{fontSize:13,lineHeight:24,textAlign:'right',marginTop:12},
  primary:{backgroundColor:'#246BFD',borderRadius:15,padding:15,alignItems:'center',marginTop:5,marginBottom:13},
  doneButton:{backgroundColor:'#31B67E'},
  primaryText:{fontSize:16,color:'#FFF'},
  progressTitle:{fontSize:16,color:'#102A43',textAlign:'right'},
  disclaimer:{fontSize:12,color:'#7A8A99',lineHeight:23,textAlign:'center',marginTop:8},
});
