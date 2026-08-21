# آپشن‌یار — نسخه موبایل Android

این مخزن آماده است تا با **GitHub Actions + Expo EAS Build** فایل APK بسازد.

## چیزی که داخل پروژه است
- اپ React Native / Expo
- لوگوی اختصاصی آپشن‌یار
- تمام سرفصل‌های دوره تا فصل پنجم
- توضیحات مفصل و مبتدی‌محور
- مثال، ریسک، دام رایج و تمرین
- تیک پیشرفت و ذخیره روی گوشی
- رابط فارسی RTL
- Build خودکار APK از GitHub

## فقط یک‌بار قبل از Build

### 1) حساب Expo
در https://expo.dev حساب بساز.

### 2) ساخت Access Token
در Expo وارد Account Settings > Access Tokens شو و یک Token بساز.

### 3) گذاشتن Token داخل GitHub
در Repository برو به:

Settings > Secrets and variables > Actions > New repository secret

Name:
EXPO_TOKEN

Value:
توکن Expo

## ساخت APK

بعد برو:

Actions > Build Android APK > Run workflow

منتظر بمان تا Build سبز شود.

سپس همان صفحه Build، پایین بخش **Artifacts** فایل:
option-yar-apk

را دانلود کن. داخل آن APK قابل نصب روی اندروید قرار دارد.

## نکته فونت Sahel
نسخه فعلی فونت Sahel را در زمان اجرای برنامه از مخزن رسمی Sahel بارگذاری می‌کند و اگر اینترنت در دسترس نباشد از فونت پیش‌فرض دستگاه استفاده می‌شود. در نسخه انتشار نهایی بهتر است فایل Sahel به‌صورت local asset در پروژه قرار بگیرد.

## منابع آموزشی
- Cboe Options Institute
- Options Industry Council (OIC)

## هشدار
این اپ آموزشی است و توصیه خرید و فروش نیست. قوانین اعمال، تسویه، وجه تضمین و تعدیلات بازار ایران پیش از انتشار عمومی باید با آخرین دستورالعمل‌های رسمی بازار تطبیق داده شود.
