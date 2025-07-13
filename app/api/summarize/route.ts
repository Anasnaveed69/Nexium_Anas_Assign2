import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import clientPromise from '@/lib/mongodb'
import { supabase } from '@/lib/supabase'

function checkEnv() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'MONGODB_URI',
  ]
  const missing = required.filter((v) => !process.env[v])
  if (missing.length > 0) {
    throw new Error('Missing environment variables: ' + missing.join(', '))
  }
}

// Simple static summary logic
function generateSummary(text: string): string {
  // Just return the first 2 sentences as a 'summary'
  const sentences = text.match(/[^.!?]+[.!?]+/g) || []
  return sentences.slice(0, 2).join(' ').trim() || text.slice(0, 200) + '...'
}

// ─────────────────────────────────────────────────────────────
// Simple English→Urdu dictionary (≈160 entries)
// Feel free to extend; keep keys lowercase for case‑insensitive look‑ups.
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// Mega English→Urdu dictionary  (≈ 400 entries)
// Put this in, e.g., src/lib/urdu-dict.ts
// ─────────────────────────────────────────────────────────────
export const urduDict: Record<string, string> = {
  /* ─── Core function words ─── */
  'a': 'ایک','an': 'ایک','and': 'اور','the': 'دی','is': 'ہے','are': 'ہیں','was': 'تھا','were': 'تھے',
  'be': 'ہونا','been': 'رہا ہے','being': 'ہو رہا ہے','has': 'ہے','have': 'ہیں','had': 'تھا','will': 'گا',
  'shall': 'گا','can': 'سکتا ہے','could': 'سکتا تھا','may': 'سکتا ہے','might': 'شاید','must': 'ضرور',
  'should': 'چاہیے','would': 'ہوگا','to': 'کو','of': 'کا','in': 'میں','on': 'پر','for': 'کے لئے',
  'with': 'کے ساتھ','from': 'سے','by': 'بذریعہ','about': 'کے بارے میں','into': 'میں','at': 'پر',
  'as': 'کے طور پر','that': 'کہ','this': 'یہ','these': 'یہ','those': 'وہ','it': 'یہ','its': 'اس کا',
  'they': 'وہ','them': 'ان','their': 'ان کا','we': 'ہم','our': 'ہمارا','us': 'ہمیں','you': 'آپ',
  'your': 'آپ کا','i': 'میں','me': 'مجھے','my': 'میرا','he': 'وہ','she': 'وہ','his': 'اس کا',
  'her': 'اس کی','who': 'کون','whom': 'کسے','what': 'کیا','when': 'کب','where': 'کہاں','why': 'کیوں',
  'how': 'کیسے','not': 'نہیں','no': 'نہیں','yes': 'جی ہاں','all': 'سب','any': 'کوئی','some': 'کچھ',
  'many': 'بہت','much': 'زیادہ','more': 'زیادہ','most': 'زیادہ تر','each': 'ہر ایک','every': 'ہر',
  'few': 'چند','other': 'دیگر','another': 'ایک اور','new': 'نیا','old': 'پرانا','same': 'ایک سا',
  'very': 'بہت','just': 'صرف','also': 'بھی','only': 'صرف','now': 'اب','then': 'پھر','than': 'سے',
  'because': 'کیونکہ','though': 'اگرچہ','while': 'جبکہ','before': 'پہلے','after': 'بعد','during': 'دوران',
  'over': 'اوپر','under': 'نیچے','again': 'دوبارہ','around': 'ارد گرد','between': 'درمیان','against': 'کے خلاف',

  /* ─── High‑frequency verbs ─── */
  'do': 'کرنا','does': 'کرتا ہے','did': 'کیا','doing': 'کر رہا','make': 'بنانا','made': 'بنایا',
  'work': 'کام کرنا','working': 'کام کر رہا','works': 'کام کرتا','use': 'استعمال کرنا','used': 'استعمال کیا',
  'using': 'استعمال کرتے','need': 'ضرورت ہے','needs': 'ضرورتیں','needed': 'ضرورت تھی','want': 'چاہنا',
  'wanted': 'چاہا','get': 'حاصل کرنا','gets': 'حاصل کرتا','got': 'حاصل کیا','give': 'دینا','gives': 'دیتا ہے',
  'given': 'دیا','find': 'ڈھونڈنا','found': 'ملا','founding': 'بانی','go': 'جانا','goes': 'جاتا ہے',
  'went': 'گیا','gone': 'جا چکا','come': 'آنا','came': 'آیا','coming': 'آ رہا','see': 'دیکھنا',
  'saw': 'دیکھا','seen': 'دیکھا گیا','know': 'جاننا','knew': 'جانتا تھا','known': 'جانا ہوا',
  'think': 'سوچنا','thought': 'سوچا','say': 'کہنا','says': 'کہتا','said': 'کہا','saying': 'کہہ رہا',
  'tell': 'بتانا','told': 'بتایا','look': 'دیکھنا','looking': 'دیکھ رہا','looks': 'دیکھتا ہے',
  'show': 'دکھانا','showed': 'دکھایا','shown': 'دکھایا گیا','believe': 'یقین کرنا','include': 'شامل کرنا',
  'includes': 'شامل کرتا','included': 'شامل کیا','help': 'مدد کرنا','helps': 'مدد کرتا','helped': 'مدد کی',
  'start': 'شروع کرنا','started': 'شروع کیا','stop': 'روکنا','stopped': 'روکا','create': 'تخلیق کرنا',
  'created': 'تخلیق کیا','build': 'تیار کرنا','built': 'بنایا','provide': 'فراہم کرنا','provided': 'فراہم کیا',
  'develop': 'ترقی دینا','developed': 'ترقی دی','improve': 'بہتر کرنا','improved': 'بہتر کیا',
  'increase': 'اضافہ کرنا','decrease': 'کم کرنا','manage': 'انتظام کرنا',' manage': 'منظم کرنا',

  /* ─── Common nouns & tech / business terms ─── */
  'blog': 'بلاگ','blogs': 'بلاگز','article': 'مضمون','articles': 'مضامین','post': 'تحریر','posts': 'تحاریر',
  'page': 'صفحہ','pages': 'صفحات','content': 'مواد','introduction': 'تعارف','conclusion': 'نتیجہ',
  'summary': 'خلاصہ','news': 'خبریں','story': 'کہانی','stories': 'کہانیاں','report': 'رپورٹ',
  'research': 'تحقیق','study': 'مطالعہ','studies': 'مطالعے','analysis': 'تجزیہ','review': 'جائزہ',
  'reviews': 'جائزے','case': 'کیس','cases': 'کیسز','example': 'مثال','examples': 'مثالیں',
  'technology': 'ٹیکنالوجی','tech': 'ٹیک','software': 'سافٹ ویئر','hardware': 'ہارڈ ویئر',
  'application': 'ایپلیکیشن','applications': 'ایپلیکیشنز','app': 'ایپ','apps': 'ایپس','platform': 'پلیٹ فارم',
  'system': 'سسٹم','systems': 'سسٹمز','tool': 'اوزار','tools': 'اوزار','framework': 'فریم ورک',
  'library': 'لائبریری','libraries': 'لائبریریز','program': 'پروگرام','programs': 'پروگرامز',
  'code': 'کوڈ','codes': 'کوڈز','developer': 'ڈویلپر','developers': 'ڈویلپرز','engineer': 'انجینئر',
  'design': 'ڈیزائن','designer': 'ڈیزائنر','interface': 'انٹرفیس','ui': 'یوزر انٹرفیس','ux': 'یوزر تجربہ',
  'product': 'پروڈکٹ','products': 'پروڈکٹس','feature': 'فیچر','features': 'فیچرز','update': 'اپڈیٹ',
  'updates': 'اپڈیٹس','version': 'ورژن','release': 'ریلیز','beta': 'بیٹا','bug': 'بگ','bugs': 'بگز',
  'error': 'غلطی','issue': 'مسئلہ','issues': 'مسائل','solution': 'حل','solutions': 'حل',
  'server': 'سرور','client': 'کلائنٹ','database': 'ڈیٹا بیس','api': 'اے پی آئی','endpoint': 'اینڈ پوائنٹ',
  'request': 'درخواست','response': 'جواب','security': 'سیکیورٹی','privacy': 'پرائیویسی',
  'authentication': 'تصدیق','authorization': 'اجازت','encryption': 'انکرپشن','performance': 'کارکردگی',
  'optimization': 'آپٹیمائزیشن','scalability': 'اسکیل ایبلٹی','cloud': 'کلاؤڈ','storage': 'اسٹوریج',
  'data': 'ڈیٹا','dataset': 'ڈیٹاسیٹ','information': 'معلومات','analytics': 'اینالٹکس',
  'machine': 'مشین','learning': 'لرننگ','ai': 'اے آئی','algorithm': 'الگورتھم','model': 'ماڈل',
  'network': 'نیٹ ورک','blockchain': 'بلاک چین','crypto': 'کرپٹو','token': 'ٹوکن',
  'business': 'کاروبار','company': 'کمپنی','startup': 'اسٹارٹ اپ','market': 'مارکیٹ',
  'marketing': 'مارکیٹنگ','sales': 'سیلز','customer': 'کسٹمر','clientele': 'گاہک',
  'service': 'سروس','support': 'سپورٹ','community': 'کمیونٹی','user': 'صارف','users': 'صارفین',
  'team': 'ٹیم','teams': 'ٹیمیں','project': 'پروجیکٹ','projects': 'پروجیکٹس','task': 'ٹاسک',
  'tasks': 'ٹاسکس','goal': 'مقصد','strategy': 'حکمت عملی','plan': 'منصوبہ','roadmap': 'روڈ میپ',
  'budget': 'بجٹ','investment': 'سرمایہ کاری','revenue': 'آمدنی','profit': 'منافع','cost': 'لاگت',
  'price': 'قیمت','value': 'قدر','growth': 'ترقی','trend': 'رجحان','future': 'مستقبل',
  'innovation': 'جدت','competition': 'مقابلہ','partner': 'شریک','partnership': 'شراکت',
  'leadership': 'قیادت','management': 'انتظام','culture': 'ثقافت','policy': 'پالیسی',
  'regulation': 'ضابطہ','compliance': 'تعمیل','risk': 'خطرہ','opportunity': 'موقع',

  /* ─── Education & general ‑ interest ─── */
  'education': 'تعلیم','school': 'اسکول','college': 'کالج','university': 'یونیورسٹی',
  'student': 'طالب علم','teacher': 'استاد','course': 'کورس','lesson': 'سبق','exam': 'امتحان',
  'health': 'صحت','medicine': 'طب','doctor': 'ڈاکٹر','patient': 'مریض','treatment': 'علاج',
  'environment': 'ماحول','energy': 'توانائی','climate': 'موسم','weather': 'موسم','food': 'خوراک',
  'water': 'پانی','transport': 'ٹرانسپورٹ','travel': 'سفر',' culture': 'ثقافت','history': 'تاریخ',
  'country': 'ملک','city': 'شہر','government': 'حکومت','election': 'انتخابات','law': 'قانون',
  'rights': 'حقوق','society': 'معاشرہ','family': 'خاندان','friend': 'دوست'," community": 'کمیونٹی',
  'art': 'فن','music': 'موسیقی','movie': 'فلم','sports': 'کھیل','game': 'کھیل',
  'language': 'زبان','english': 'انگریزی','urdu': 'اردو','percentage': 'فیصد',

  /* ─── Numbers & time ─── */
  'zero': 'صفر','one': 'ایک','two': 'دو','three': 'تین','four': 'چار','five': 'پانچ',
  'six': 'چھے','seven': 'سات','eight': 'آٹھ','nine': 'نو','ten': 'دس',
  'first': 'پہلا','second': 'دوسرا','third': 'تیسرا','fourth': 'چوتھا','fifth': 'پانچواں',
  'day': 'دن','days': 'دن','week': 'ہفتہ','weeks': 'ہفتے','month': 'مہینہ','months': 'مہینے',
  'year': 'سال','years': 'سال','hour': 'گھنٹہ','minute': 'منٹ',' second': 'سیکنڈ',
  'today': 'آج','yesterday': 'کل','tomorrow': 'کل','morning': 'صبح','evening': 'شام','night': 'رات'
};



function translateToUrdu(text: string): string {
  return text.split(' ').map(word => urduDict[word.toLowerCase()] || word).join(' ')
}

async function scrapeBlogText(url: string): Promise<{text: string, title: string}> {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    })
    
    // Simple text extraction without Cheerio
    const html = data.toString()
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : 'Blog Post'
    
    // Extract text content (remove HTML tags)
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove styles
      .replace(/<[^>]+>/g, ' ') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
    
    return { text, title }
  } catch (error) {
    console.error('Scraping error:', error)
    throw new Error('Failed to scrape the blog content')
  }
}

export async function POST(req: NextRequest) {
  try {
    checkEnv()
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: 'No URL provided' }, { status: 400 })

    // Scrape blog
    const { text, title } = await scrapeBlogText(url)
    if (!text) return NextResponse.json({ error: 'Could not extract text' }, { status: 422 })

    // Generate summary
    const summary = generateSummary(text)
    const summary_urdu = translateToUrdu(summary)

    // Save summary to Supabase
    const { error: supabaseError } = await supabase.from('summaries').insert([{ url, title, summary, summary_urdu }])
    if (supabaseError) throw new Error('Supabase error: ' + supabaseError.message)

    // Save full text to MongoDB
    let client
    try {
      client = await clientPromise
    } catch (e) {
      throw new Error('MongoDB connection error: ' + (e as Error).message)
    }
    const db = client.db('blog_summarizer')
    try {
      await db.collection('blog_posts').insertOne({ url, title, fullText: text, createdAt: new Date() })
    } catch (e) {
      throw new Error('MongoDB insert error: ' + (e as Error).message)
    }

    return NextResponse.json({ summary, summary_urdu, title })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
} 