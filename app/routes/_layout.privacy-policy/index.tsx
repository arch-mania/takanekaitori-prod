import type { MetaFunction } from '@remix-run/node';
import ContentsLayout from '~/components/layouts/ContentsLayout';

export const meta: MetaFunction = () => {
  return [
    { title: 'プライバシーポリシー | 居抜きビュッフェ Presented by 店舗高値買取センター' },
    {
      name: 'description',
      content: '株式会社店舗高値買取センターのプライバシーポリシーについてご説明します。',
    },
  ];
};

const PRIVACY_POLICY_CONTENT = {
  intro:
    'プライバシーポリシー（個人情報保護方針）株式会社店舗高値買取センター（以下、「当社」という。）は，ユーザーの個人情報について以下のとおりプライバシーポリシー（以下、「本ポリシー」という。）を定めます。本ポリシーは、当社がどのような個人情報を取得し、どのように利用・共有するか、ユーザーがどのようにご自身の個人情報を管理できるかをご説明するものです。',
  sections: [
    {
      title: '1.事業者情報',
      content:
        '法人名：株式会社店舗高値買取センター\n住所：東京都新宿区西新宿1-4-11 全研プラザビル4階\n代表者：佐藤一桐',
    },
    {
      title: '2．個人情報の取得方法',
      content:
        '当社はユーザーが利用登録をするとき、氏名・生年月日・住所・電話番号・メールアドレスなど個人を特定できる情報を取得させていただきます。お問い合わせフォームやコメントの送信時には、氏名・電話番号・メールアドレスを取得させていただきます。',
    },
    {
      title: '3．個人情報の利用目的',
      content:
        '取得した閲覧・購買履歴等の情報を分析し、ユーザー別に適した商品・サービスをお知らせするために利用します。また、取得した閲覧・購買履歴等の情報は、結果をスコア化した上で当該スコアを第三者へ提供します。',
    },
    {
      title: '4．個人データを安全に管理するための措置',
      content:
        '当社は個人情報を正確かつ最新の内容に保つよう努め、不正なアクセス・改ざん・漏えい・滅失及び毀損から保護するため全従業員及び役員に対して教育研修を実施しています。また、個人情報保護規程を設け、現場での管理についても定期的に点検を行っています。',
    },
    {
      title: '5．個人データの共同利用',
      content:
        '当社は、以下のとおり共同利用を行います。個人データの管理に関する責任者 株式会社店舗高値買取センター共同して利用する者の利用目的上記「利用目的」の内容と同様。利用項目氏名、住所、電話番号、メールアドレス共同して利用する者の範囲当社企業グループを構成する企業',
    },
    {
      title: '6．個人データの第三者提供について',
      content:
        '当社は法令及びガイドラインに別段の定めがある場合を除き、同意を得ないで第三者に個人情報を提供することは致しません。',
    },
    {
      title: '7．保有個人データの開示、訂正',
      content:
        '当社は本人から個人情報の開示を求められたときには、遅滞なく本人に対しこれを開示します。個人情報の利用目的の通知や訂正、追加、削除、利用の停止、第三者への提供の停止を希望される方は以下の手順でご請求ください。（各社請求方法を指定）送付先住所：東京都千代田区神田駿河台1-7-10 YK駿河台ビル4階 株式会社店舗高値買取センター お問い合わせ窓口',
    },
    {
      title: '8．個人情報取り扱いに関する相談や苦情の連絡先',
      content:
        '当社の個人情報の取り扱いに関するご質問やご不明点、苦情、その他のお問い合わせはお問い合わせフォームよりご連絡ください。',
    },
    {
      title: '9．SSL（Secure Socket Layer）について',
      content:
        '当社のWebサイトはSSLに対応しており、WebブラウザとWebサーバーとの通信を暗号化しています。ユーザーが入力する氏名や住所、電話番号などの個人情報は自動的に暗号化されます。',
    },
    {
      title: '10．cookieについて',
      content:
        'cookieとは、WebサーバーからWebブラウザに送信されるデータのことです。Webサーバーがcookieを参照することでユーザーのパソコンを識別でき、効率的に当社Webサイトを利用することができます。当社Webサイトがcookieとして送るファイルは、個人を特定するような情報は含んでおりません。お使いのWebブラウザの設定により、cookieを無効にすることも可能です。',
    },
    {
      title: '11．プライバシーポリシーの制定日及び改定日',
      content: '制定：2023年5月1日',
    },
    {
      title: '12．免責事項',
      content:
        '当社Webサイトに掲載されている情報の正確性には万全を期していますが、利用者が当社Webサイトの情報を用いて行う一切の行為に関して、一切の責任を負わないものとします。当社は、利用者が当社Webサイトを利用したことにより生じた利用者の損害及び利用者が第三者に与えた損害に関して、一切の責任を負わないものとします。',
    },
    {
      title: '13．著作権・肖像権',
      content:
        '当社Webサイト内の文章や画像、すべてのコンテンツは著作権・肖像権等により保護されています。無断での使用や転用は禁止されています。',
    },
    {
      title: '14．リンク',
      content:
        '当社Webサイトへのリンクは、自由に設置していただいて構いません。ただし、Webサイトの内容等によってはリンクの設置をお断りすることがあります。',
    },
  ],
};

const Section = ({ title, content }: { title: string; content: string }) => (
  <div className="space-y-2">
    <h2 className="text-base font-bold md:text-lg">{title}</h2>
    <p className="text-sm md:text-base">{content}</p>
  </div>
);

export default function PrivacyPolicy() {
  return (
    <ContentsLayout className="mx-auto max-w-[950px] py-14 md:py-[72px]">
      <h1 className="text-2xl font-bold">プライバシーポリシー</h1>
      <div className="mt-8 space-y-10 md:mt-10 md:space-y-16">
        <p className="text-sm md:text-base">{PRIVACY_POLICY_CONTENT.intro}</p>
        {PRIVACY_POLICY_CONTENT.sections.map((section, index) => (
          <Section key={index} title={section.title} content={section.content} />
        ))}
      </div>
    </ContentsLayout>
  );
}
