module.exports = function (migration) {
  // const area = migration
  //   .createContentType('area')
  //   .name('地方区分マスタ')
  //   .description('関東・関西などの大きな地方区分');

  // area.createField('name').name('エリア名').type('Symbol').required(true);

  // area.createField('order').name('並び順').type('Integer').required(true);

  // area.createField('slug').name('スラッグ').type('Symbol').required(true);


  // const region = migration
  //   .createContentType('region')
  //   .name('都道府県/地域マスタ')
  //   .description('都道府県と東京23区などの地域');

  // region.createField('name').name('地域名').type('Symbol').required(true);

  // region
  //   .createField('area')
  //   .name('エリア')
  //   .type('Link')
  //   .linkType('Entry')
  //   .validations([
  //     {
  //       linkContentType: ['area'],
  //     },
  //   ])
  //   .required(true);

  // region.createField('order').name('並び順').type('Integer').required(true);

  // region.createField('areaSearchOrder').name('物件検索の抽出条件の並び順').type('Integer').required(true);

  // const station = migration
  //   .createContentType('station')
  //   .name('駅名マスタ')
  //   .description('物件の最寄駅');

  // station.createField('name').name('駅名').type('Symbol').required(true);

  // station
  //   .createField('area')
  //   .name('エリア')
  //   .type('Link')
  //   .linkType('Entry')
  //   .validations([
  //     {
  //       linkContentType: ['area'],
  //     },
  //   ])
  //   .required(true);

  // station.createField('order').name('並び順').type('Integer').required(true);

  // station.createField('popularityOrder').name('人気の駅並び順').type('Integer').required(true);

  // const restaurantType = migration
  //   .createContentType('restaurantType')
  //   .name('飲食店タイプマスタ')
  //   .description('出店可能な飲食店の種類');

  // restaurantType.createField('name').name('タイプ名').type('Symbol').required(true);

  // restaurantType.createField('description').name('説明').type('Text');

  // restaurantType.createField('order').name('表示順').type('Integer').required(true);

  const property = migration
    .createContentType('property')
    .name('物件データ')
    .description('物件情報');

  property.createField('propertyId').name('物件ID').type('Symbol').required(true);

  property.createField('title').name('物件タイトル').type('Symbol');

  property
    .createField('regions')
    .name('地域')
    .type('Array')
    .items({
      type: 'Link',
      linkType: 'Entry',
      validations: [{ linkContentType: ['region'] }],
    })
    .required(true);

  property
    .createField('stationsName')
    .name('駅名')
    .type('Array')
    .items({
      type: 'Link',
      linkType: 'Entry',
      validations: [{ linkContentType: ['station'] }],
    })
    .required(true);

  property.createField('stationName1').name('最寄り路線1').type('Symbol');

  property
    .createField('walkingTimeToStation')
    .name('徒歩時間（分）')
    .type('Integer')
    .validations([
      {
        range: {
          min: 1,
          max: 999,
        },
      },
    ]);

  property.createField('address').name('所在地').type('Symbol').required(true);

  property.createField('rent').name('賃料').type('Number').required(true);

  property.createField('pricePerTsubo').name('坪単価').type('Number');

  property.createField('nonRefundableDeposit').name('権利金礼金').type('Symbol');

  property.createField('securityDeposit').name('保証金敷金').type('Symbol');

  property.createField('floorArea').name('面積').type('Number');

  property.createField('floorAreaTsubo').name('面積（坪）').type('Number');

  property.createField('isNew').name('新着かどうか').type('Boolean').required(true);

  property.createField('isSkeleton').name('スケルトンかどうか').type('Boolean').required(true);

  property.createField('isInteriorIncluded').name('居抜きかどうか').type('Boolean').required(true);

  property.createField('isWatermarkEnabled').name('情報を隠すか').type('Boolean').required(true);

  property.createField('interiorTransferFee').name('造作譲渡料/前テナント').type('Symbol');

  property
    .createField('floors')
    .name('階数')
    .type('Array')
    .items({
      type: 'Symbol',
      validations: [
        {
          in: [
            'B3',
            'B2',
            'B1',
            '1',
            '2',
            '3',
            '4',
            '5',
            '6',
            '7',
            '8',
            '9',
            '10',
            '11',
            '12',
            '13',
            '14',
            '15',
            '16',
            '17',
            '18',
            '19',
            '20',
            '21',
            '22',
            '23',
            '24',
            '25',
            '26',
            '27',
            '28',
            '29',
            '30',
          ],
        },
      ],
    });

  property
    .createField('allowedRestaurantTypes')
    .name('出店可能な飲食店タイプ')
    .type('Array')
    .items({
      type: 'Link',
      linkType: 'Entry',
      validations: [{ linkContentType: ['restaurantType'] }],
    });

  property.createField('notes').name('備考').type('Text');

  property.createField('floorPlan').name('間取り図').type('Link').linkType('Asset');

  property.createField('exteriorImages').name('外観図').type('Array').items({
    type: 'Link',
    linkType: 'Asset',
  });

  property
    .createField('internalNotes')
    .name('取り扱い注意事項')
    .type('Text')
    .validations([
      {
        size: {
          max: 1000,
        },
      },
    ])
    .required(false);

  property.createField('assignedAgent').name('担当者').type('Symbol').required(false);

  property.createField('registrationDate').name('登録日').type('Date').required(true);
};
