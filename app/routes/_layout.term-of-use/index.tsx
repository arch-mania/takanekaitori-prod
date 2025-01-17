import type { MetaFunction } from '@remix-run/node';
import ContentsLayout from '~/components/layouts/ContentsLayout';

export const meta: MetaFunction = () => {
  return [
    { title: '利用規約 | 居抜きビュッフェ Presented by 店舗高値買取センター' },
    {
      name: 'description',
      content: '株式会社店舗高値買取センターの利用規約についてご説明します。',
    },
  ];
};

const TERM_OF_USE_CONTENT = {
  sections: [
    {
      title: '第1条（規約の適用）',
      content: `1. 本規約は、株式会社店舗高値買取センター（以下「当社」といいます。）が企画・運営するインターネット上の飲食店向け情報提供サービス総合サイト「居抜きビュッフェ」（以下「本サイト」といいます。）およびこれに付随するメール配信その他の各種情報提供サービス（以下「本サイト」を含めて「本サービス」といいます。）の利用者の皆様に対して適用されます。
2. 当社が、本サイトにおいて但し書き、諸注意等（以下「個別規約」といいます。）を掲示している場合には個別規約がそれぞれ本規約の一部となります。その場合には、本規約に加え当該個別規約が適用されるものとします。
3. 当社は、利用者による本サイトの利用をもって、本規約に同意したものとみなします。`,
    },
    {
      title: '第2条（本規約及び個別規約の変更）',
      content: `1. 当社は、利用者に事前の通知をすることなく本規約及び個別規約の変更（追加・削除を含みます。以下同様。）をすることがあります。
2. 変更された本規約及び個別規約は、これらを本サイトに掲示した後、利用者が本サイトにアクセスし、利用した時点をもって承諾したものとみなします。`,
    },
    {
      title: '第3条（利用者の禁止事項）',
      content: `1. 利用者の皆様は、本サービスの利用にあたり、次の各号に該当する行為をしてはならないものとします。
【1】本サイトを不正の目的をもって利用する行為
【2】他人になりすまして情報を送信または書き込む行為
【3】当社の承認した以外の方法により本サービスを利用する行為
【4】当社、他の利用者または第三者の著作権、肖像権、その他知的財産権を侵害する行為
【5】当社、他の利用者または第三者を差別、誹謗中傷、脅迫する行為
【6】当社、他の利用者または第三者のプライバシー、人権等を侵害する行為
【7】当社、他の利用者または第三者の信用を傷付け、損害を与える行為
【8】本サービスを無断で改変する行為
【9】有害なコンピュータプログラム等を送信または書き込む行為、およびスパムメール、チェーンレター、ジャンクメール等を送信する行為
【10】意図的に虚偽の情報を登録する行為
【11】公序良俗に反する内容の情報、文書または図形等を他人に公開する行為
【12】当社または第三者に対する迷惑行為および不利益となる行為、もしくはこれらのおそれがあると当社が判断した行為【13】その他法律、法令、公序良俗に反する行為、またはそのおそれのある行為
【14】本サイトのサービスの利用、提供又は運営を妨げる行為
【15】その他当社が不適切と判断する行為
2. 前項行為により当社、他の利用者または第三者が損害を被った場合には、利用者は当該賠償においてすべての責を負うものとし、他の利用者およびまたは第三者に損害を与えないものとします。
3. 当社は、利用者が前2項の行為を行った場合又はそのおそれがある場合には、事前に通知することなく、本サイトの利用の停止をすることができることとし、当社の判断にて、利用者の承諾なく、削除・修正を行うことができるものとします。`,
    },
    {
      title: '第4条（著作権）',
      content: `1. 本サイト上の掲載情報に関する特許権、商標権、著作権その他の知的財産権はすべて、当社に帰属します。本サイト上で明示されている場合、または当社・その他の権利者の許可を得ているものを除き、掲載情報及びこれに関する知的財産権を無断で実施、使用、複製、転載、配布、公開、公衆送信等の他一切の処分を行うことはできません。
2. 前項の規定に違反して紛争が生じた場合、利用者は利用者の責任で解決し、当社が被った損害においても利用者が賠償するものとします。
3. 利用者の皆様は当社の権利を侵害してはならず、また、本サイトを逆アセンブル、逆コンパイル、リバースエンジニアリング、変更、改変、改造等しないものとします。
4. 利用者は、本サービスを利用することにより得た本サイト運営方法の情報・技術情報、個人情報等をもとに、当社と同様の業務を行ってはならないものとします。また、有償無償を問わず、同情報を第三者に提供してはなりません。`,
    },
    {
      title: '第5条（本サービスの提供の中断等）',
      content: `1. 当社は、次の各号に該当する場合、利用者の皆様への事前の通知や承諾なしに、本サービスの一時的な運用の停止を行うことがあります。
【1】本サービスの保守または仕様の変更を行う場合
【2】天災、事変その他非常事態が発生し、または発生するおそれがあり、本サービスの運営が困難または不可能となった場合
【3】当社が、本サービスの運営上およびその他の理由で本サービスの一時的な運用停止が必要と判断した場合
2. 前項の規定により本サービスの運用が一時的に停止され、これに起因して利用者の皆様に損害が発生した場合であっても、当社は一切の責任を負いません。
3. 当社が必要と判断した場合には、事前に通知することなくいつでも本サービスの内容を変更し、または本サービスの提供を停止もしくは中止することができるものとし、本サービスの全部または一部の提供に遅延もしくは中断が発生しても、これに起因する利用者または第三者が被った損害に関し、本利用規約で特に定める場合を除き、一切の責任を負いません。`,
    },
    {
      title: '第6条（当社の責任）',
      content: `1. 当社は、本サービスにおいて信頼できるサービスや情報を利用者の皆様へお届けすべく努力をしていますが、次の各号については一切保証致しません。本サービスのご利用に際しては、利用者の皆様ご自身が、提供される情報やサービスの有用性等を判断し、ご自身の責任でご利用ください。
【1】本サービス上で提供される全ての情報（本サービスとして、および本サービス上に表示される、第三者が管理・運営するリンクサイト内に含まれる一切の情報等を含みます。以下、同様とします。）に関する、有用性、適合性、完全性、正確性、安全性、合法性および最新性等。
【2】利用者の皆様が本サービス上において提供される情報を利用して第三者と交渉もしくは契約の申込または締結等を行なう場合において、当該行為に関する一切。
【3】本サービスおよび本サービスを通じて入手できる商品、役務、情報等が利用者の皆様の希望または期待を満たす適切なものであること。
【4】本サービスの提供に不具合、エラーまたは障害が生じないこと。
【5】本サイトに関連して送信される電子メール、ウェブコンテンツ等に、コンピュータウィルス等の有害なものが含まれていないこと。
2. 前項各号の他、本サイトの利用に起因する利用者と第三者間のあらゆる紛争や損害について、当社は一切の何ら責任を負いません。
3. 当社は、本サービスについて、いつでも当社の判断のみにより、その内容の修正、削除、追加、改廃等を行うことができるものとし、本サービスの存続または同一性が維持されることを一切保証致しません。`,
    },
    {
      title: '第7条（反社会的勢力の排除）',
      content: `1. 利用者の皆様は、本サービスの利用にあたり、自己が次の各号に該当しないことを表明し、かつ将来にわたっても該当しないことを確約します。
【1】暴力団
【2】暴力団員
【3】暴力団準構成員
【4】暴力団関係企業
【5】企業等を対象に不正な利益を求めて暴力的な違法行為等を行うおそれがあり、市民生活の安全に脅威を与える者
【6】社会運動もしくは政治活動を仮装し、または標ぼうして、不正な利益を求めて暴力的な違法行為等を行うおそれがあり、市民生活の安全に脅威を与える者
【7】前各号に掲げる者のほか、暴力団との関係を背景に、その威力を用い、または暴力団と資金的なつながりを有し、構造的な不正の中核となっている集団または個人
【8】その他前各号に準ずる者
2. 利用者の皆様は、本サービスの利用にあたり、自らまたは第三者を利用して次の各号に該当する行為を行わないことを確約するものとします。
【1】暴力的な要求行為
【2】法的な責任を越えた不当な要求行為
【3】脅迫的な言動をし、または暴力を用いる行為
【4】風説を流布し、偽計を用いまたは威力を用いて当社の信用を棄損し、または当社の業務を妨害する行為
【5】その他前各号に準ずる行為
3. 当社は、利用者の皆様が前項に違反した場合、催告その他何らの手続も要することなく、直ちに本サービスの利用停止、登録の抹消等必要な措置を行い、以後将来にわたり本サービスの利用を禁ずることができるものとします。
4. 利用者の皆様は、前項の規定により本サービスの利用停止、登録の抹消等が行われた場合、当社に対して何らの損害賠償ないし補償を請求することはできず、また当社に損害が生じたときは、その損害を賠償するものとします。`,
    },
    {
      title: '第8条（個人情報及び個人関連情報の取扱い）',
      content: `当社は、本サービスをご利用になる皆様のプライバシーを尊重し、利用者の皆様の個人情報の管理に細心の注意を払います。本サービスの管理・運営に当たって、当社が利用者の皆様から取得した個人情報及び個人関連情報は、当社が別途定めるプライバシーポリシーに従って取り扱われます。`,
    },
    {
      title: '第9条（権利義務の譲渡禁止）',
      content: `利用者の皆様は、本サービスに関する利用者としての地位および当該地位に基づく権利義務を、当社が予め承諾した場合を除き、第三者に譲渡しまたは担保に供してはならないものとします。`,
    },
    {
      title: '第10条（免責事項）',
      content: `1. 当社は、本サービスの利用に際し、利用者の皆様に以下の損害が生じた場合、当該損害について一切の責任を負わないものとします。
【1】本サービスを介して行う、第三者が提供するコンテンツのダウンロード、および、第三者が管理・運営するリンクサイトへのアクセス等の行為により、利用者の皆様に生じた損害。
【2】第三者による本サービスの無断改変、本サービスに関するデータへの不正アクセス、コンピュータウィルスの混入等の不正行為が行われ、これに起因して利用者の皆様に生じた損害。
2. 利用者の皆様は、自己の責任において本サービスを利用するものとし、情報の提供やメールの送受信、利用者間のやり取り等に関し、利用者相互間または第三者との間で紛争が生じた場合であっても、当社は一切の責任を負わないものとします。
3. 前2項に定める場合のほか、利用者の皆様が、本サービスの利用に際し、当社の故意又は過失によらない事由により被った損害について、当社は一切の責任を負わないものとします。
4. 外部からの不正アクセスもしくはシステムの不具合による障害等が発生し、システムが利用できない事態が生じた場合、システムを利用できないことによって生じる利用者の皆様の全ての不利益について、当社は一切の責任を負わないものとします。
5. 当社は、下記の各号に該当する記載を発見した場合、予告なく、当該記載を削除し、又は記載の修正を行う場合があります。なお、削除や修正対象に該当するか否かの判断は、全て当社が行い、当社は、削除や修正を行った理由について、開示する義務を負いません。また、削除や修正に起因して損害が生じたとしても、当社は、一切の責任を負わないものとします。
【1】本規約に反する記載
【2】公序良俗に反する記載
【3】有害なプログラム・スクリプトなどを含む記載
【4】他人の名誉・信用を害する記載
【5】本サービスの運営を妨げる記載
【6】その他、当社が不適切であると判断した記載
6. 当社はいかなる状況においても、またいかなる方に対しても、以下の各号に定める事項について一切の責任を負わないものとします。
【1】本サービスを通じて提供される情報の入手、収集、編纂、解釈、分析、編集、翻訳、送付、伝達、配布に関わる誤り（当社の不注意によるか、その他によるかを問わず）又はその他の状況により（全部、一部を問わず）引き起こされ、発生し、若しくはこれらに起因する損失又は損害
【2】本サービスを通じて提供される情報の使用又は使用不可能により発生する、あらゆる種類の直接的、間接的、特別、二次的、又は付随的な損害（このような損害の可能性について当社が事前に通告を受けたかどうかを問いません。）`,
    },
    {
      title: '第11条（開発中のサービスについて）',
      content: `1. 当社は、本サービスの一部または独立したサービスとして、開発中のサービスを提供することができるものとします。
2. 利用者は、開発中のサービスがその性質上、バグや瑕疵、誤作動等、正常に動作しない症状等の不具合を含み得るものとして提供されることを理解するものとします。
3. 当社は、当社が必要と判断した場合には、事前に通知することなくいつでも開発中のサービスの内容を変更し、または開発中のサービスの提供を停止もしくは中止することができるものとします。
4. 当社は、開発中のサービスの完全性、正確性、適用性、有用性、利用可能性、安全性、確実性等につきいかなる保証も一切しません。`,
    },
    {
      title: '第12条（準拠法および裁判管轄）',
      content: `本規約の準拠法は日本法とし、本規約および諸注意等ならびに本サービスに関する一切の紛争は、東京地方裁判所を第一審専属合意管轄裁判所とします。`,
    },
    {
      title: '',
      content: `附則
2024年11月1日　施行`,
    },
  ],
};

const Section = ({ title, content }: { title: string; content: string }) => (
  <div className="space-y-2">
    <h2 className="text-base font-bold md:text-lg">{title}</h2>
    <p className="whitespace-pre-wrap text-sm md:text-base">{content}</p>
  </div>
);

export default function TermOfUse() {
  return (
    <ContentsLayout className="mx-auto max-w-[950px] py-14 md:py-[72px]">
      <h1 className="text-2xl font-bold">利用規約</h1>
      <div className="mt-8 space-y-10 md:mt-10 md:space-y-16">
        {TERM_OF_USE_CONTENT.sections.map((section, index) => (
          <Section key={index} title={section.title} content={section.content} />
        ))}
      </div>
    </ContentsLayout>
  );
}
