export interface PriceOption {
  value: string;
  label: string;
}

export interface AreaOption {
  value: string;
  label: string;
}

export interface WalkingTimeOption {
  value: string;
  label: string;
}

export const PRICE_OPTIONS: PriceOption[] = [
  { value: '10', label: '10万円' },
  { value: '20', label: '20万円' },
  { value: '30', label: '30万円' },
  { value: '40', label: '40万円' },
  { value: '50', label: '50万円' },
  { value: '60', label: '60万円' },
  { value: '70', label: '70万円' },
  { value: '80', label: '80万円' },
  { value: '90', label: '90万円' },
  { value: '100', label: '100万円' },
  { value: '150', label: '150万円' },
  { value: '200', label: '200万円' },
  { value: '300', label: '300万円' },
  { value: '400', label: '400万円' },
  { value: '500', label: '500万円' },
];

export const AREA_OPTIONS: AreaOption[] = [
  { value: '10', label: '10坪' },
  { value: '15', label: '15坪' },
  { value: '20', label: '20坪' },
  { value: '25', label: '25坪' },
  { value: '30', label: '30坪' },
  { value: '35', label: '35坪' },
  { value: '40', label: '40坪' },
  { value: '45', label: '45坪' },
  { value: '50', label: '50坪' },
  { value: '60', label: '60坪' },
  { value: '70', label: '70坪' },
  { value: '80', label: '80坪' },
  { value: '90', label: '90坪' },
  { value: '100', label: '100坪' },
];

export const WALKING_TIME_OPTIONS: WalkingTimeOption[] = [
  { value: '指定なし', label: '指定なし' },
  { value: '1分', label: '1分' },
  { value: '3分以内', label: '3分以内' },
  { value: '5分以内', label: '5分以内' },
  { value: '10分以内', label: '10分以内' },
  { value: '15分以内', label: '15分以内' },
];

export const FLOOR_OPTIONS = {
  BASEMENT: 'basement',
  FIRST: 'first',
  SECOND: 'second',
  THIRD_AND_ABOVE: 'thirdAndAbove',
  MULTI_FLOOR_WITH_FIRST: 'multiFloorWithFirst',
  MULTI_FLOOR_WITHOUT_FIRST: 'multiFloorWithoutFirst',
} as const;

export const FLOOR_LABELS = {
  [FLOOR_OPTIONS.BASEMENT]: '地下',
  [FLOOR_OPTIONS.FIRST]: '1階',
  [FLOOR_OPTIONS.SECOND]: '2階',
  [FLOOR_OPTIONS.THIRD_AND_ABOVE]: '3階以上',
  [FLOOR_OPTIONS.MULTI_FLOOR_WITH_FIRST]: '複数階一括(1階を含む)',
  [FLOOR_OPTIONS.MULTI_FLOOR_WITHOUT_FIRST]: '複数階一括(1階を含まない)',
} as const;
