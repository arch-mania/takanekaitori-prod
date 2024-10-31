import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { useEffect, useState } from 'react';
import {
  PRICE_OPTIONS,
  AREA_OPTIONS,
  WALKING_TIME_OPTIONS,
  FLOOR_OPTIONS,
  FLOOR_LABELS,
} from '~/constants/searchFilters';
import { AnimatedNumber } from './AnimatedNumber';

interface FilterState {
  minRent: string;
  maxRent: string;
  minArea: string;
  maxArea: string;
  isSkeleton: boolean;
  isInteriorIncluded: boolean;
  isNew: boolean;
  floors: {
    [key: string]: boolean;
    basement: boolean;
    first: boolean;
    second: boolean;
    thirdAndAbove: boolean;
    multiFloorWithFirst: boolean;
    multiFloorWithoutFirst: boolean;
  };
  regions: string[];
  stations: string[];
  allowedRestaurantTypes: string[];
  keyword: string;
  walkingTime: string;
}

interface Region {
  id: string;
  name: string;
  area: {
    fields: {
      name: string;
    };
  };
}

interface Station {
  id: string;
  name: string;
  popularityOrder: number;
}

interface SearchFiltersProps {
  isInitialLoad: boolean;
  filters: FilterState;
  regions: Region[];
  stations: Station[];
  restaurantTypes: Array<{ id: string; name: string }>;
  displayCount: number;
  inputValue: string;
  placeholder: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFilterChange: (name: string, value: any) => void;
  onSearch: () => void;
}

const useDebounce = (value: string, delay: number = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

const RangeSelect = ({
  label,
  options,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
}: {
  label: string;
  options: Array<{ value: string; label: string }>;
  minValue: string;
  maxValue: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
}) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <div className="flex flex-wrap items-center justify-between">
      <Select value={minValue} onValueChange={onMinChange}>
        <SelectTrigger className="lg :w-auto w-5/12">
          <SelectValue placeholder="" defaultValue="" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="下限なし">下限なし</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="w-fit text-sm">〜</span>
      <Select value={maxValue} onValueChange={onMaxChange}>
        <SelectTrigger className="w-5/12 lg:w-auto">
          <SelectValue placeholder="" defaultValue="" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="上限なし">上限なし</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </div>
);

const PropertyStatusFilters = ({
  filters,
  onFilterChange,
}: {
  filters: FilterState;
  onFilterChange: (name: string, value: boolean) => void;
}) => (
  <div className="space-y-2">
    <Label>物件の状態</Label>
    <div className="flex flex-col space-y-2">
      {[
        { id: 'new', label: '新着物件', value: filters.isNew },
        { id: 'skeleton', label: 'スケルトン物件', value: filters.isSkeleton },
        { id: 'interior', label: '居抜き物件', value: filters.isInteriorIncluded },
      ].map(({ id, label, value }) => (
        <div key={id} className="flex items-center space-x-2">
          <Checkbox
            id={id}
            checked={value}
            onCheckedChange={(checked) => onFilterChange(id, checked)}
          />
          <Label htmlFor={id} variant="filter">
            {label}
          </Label>
        </div>
      ))}
    </div>
  </div>
);

const FloorFilters = ({
  floors,
  onFilterChange,
}: {
  floors: FilterState['floors'];
  onFilterChange: (name: string, value: any) => void;
}) => (
  <div className="space-y-2">
    <Label>階数</Label>
    <div className="flex flex-wrap gap-y-[10px]">
      {Object.entries(FLOOR_OPTIONS).map(([key, value]) => (
        <div
          key={value}
          className={`flex items-center space-x-2 ${
            value.includes('multiFloor') ? 'w-full' : 'w-1/2'
          }`}
        >
          <Checkbox
            id={value}
            checked={floors[value]}
            onCheckedChange={(checked) => onFilterChange('floors', { ...floors, [value]: checked })}
          />
          <Label htmlFor={value} variant="filter">
            {FLOOR_LABELS[value]}
          </Label>
        </div>
      ))}
    </div>
  </div>
);

const LocationFilters = ({
  regions,
  stations,
  filters,
  onFilterChange,
}: {
  regions: Region[];
  stations: Station[];
  filters: FilterState;
  onFilterChange: (name: string, value: string[]) => void;
}) => (
  <div className="space-y-2">
    <Label>エリア</Label>
    <div className="grid grid-cols-2 gap-[10px]">
      {regions.map((region) => (
        <div key={region.id} className="flex items-center space-x-2">
          <Checkbox
            id={`region-${region.id}`}
            checked={filters.regions.includes(region.name)}
            onCheckedChange={(checked) => {
              const newRegions = checked
                ? [...filters.regions, region.name]
                : filters.regions.filter((r) => r !== region.name);
              onFilterChange('regions', newRegions);
            }}
          />
          <Label htmlFor={`region-${region.id}`} variant="filter">
            {region.name}
          </Label>
        </div>
      ))}
      {stations
        .sort((a, b) => (a.popularityOrder || 0) - (b.popularityOrder || 0))
        .map((station) => (
          <div key={station.id} className="flex items-center space-x-2">
            <Checkbox
              id={`station-${station.id}`}
              checked={filters.stations.includes(station.name)}
              onCheckedChange={(checked) => {
                const newStations = checked
                  ? [...filters.stations, station.name]
                  : filters.stations.filter((s) => s !== station.name);
                onFilterChange('stations', newStations);
              }}
            />
            <Label htmlFor={`station-${station.id}`} variant="filter">
              {station.name}
            </Label>
          </div>
        ))}
    </div>
  </div>
);

const RestaurantTypeFilters = ({
  restaurantTypes,
  filters,
  onFilterChange,
}: {
  restaurantTypes: Array<{ id: string; name: string }>;
  filters: FilterState;
  onFilterChange: (name: string, value: string[]) => void;
}) => (
  <div className="space-y-2">
    <Label>出店可能な飲食店の種類</Label>
    {restaurantTypes.map((type) => (
      <div key={type.id} className="flex items-center space-x-2">
        <Checkbox
          id={`type-${type.id}`}
          checked={filters.allowedRestaurantTypes.includes(type.name)}
          onCheckedChange={(checked) => {
            const newTypes = checked
              ? [...filters.allowedRestaurantTypes, type.name]
              : filters.allowedRestaurantTypes.filter((t) => t !== type.name);
            onFilterChange('allowedRestaurantTypes', newTypes);
          }}
        />
        <Label htmlFor={`type-${type.id}`} variant="filter">
          {type.name}
        </Label>
      </div>
    ))}
  </div>
);

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  regions,
  stations,
  restaurantTypes,
  displayCount,
  inputValue,
  placeholder,
  onInputChange,
  onFilterChange,
  onSearch,
}) => {
  const debouncedKeyword = useDebounce(inputValue, 500);

  useEffect(() => {
    onFilterChange('keyword', debouncedKeyword);
  }, [debouncedKeyword]);

  return (
    <div className="space-y-6 p-4">
      <h2 className="bg-[#F3F5F6] py-[9px] text-center text-base font-medium">条件で絞る</h2>

      <RangeSelect
        label="賃料"
        options={PRICE_OPTIONS}
        minValue={filters.minRent}
        maxValue={filters.maxRent}
        onMinChange={(value) => onFilterChange('minRent', value)}
        onMaxChange={(value) => onFilterChange('maxRent', value)}
      />

      <RangeSelect
        label="面積"
        options={AREA_OPTIONS}
        minValue={filters.minArea}
        maxValue={filters.maxArea}
        onMinChange={(value) => onFilterChange('minArea', value)}
        onMaxChange={(value) => onFilterChange('maxArea', value)}
      />

      <PropertyStatusFilters
        filters={filters}
        onFilterChange={(name, value) => {
          switch (name) {
            case 'new':
              onFilterChange('isNew', value);
              break;
            case 'skeleton':
              onFilterChange('isSkeleton', value);
              break;
            case 'interior':
              onFilterChange('isInteriorIncluded', value);
              break;
          }
        }}
      />

      <LocationFilters
        regions={regions}
        stations={stations}
        filters={filters}
        onFilterChange={onFilterChange}
      />

      <RestaurantTypeFilters
        restaurantTypes={restaurantTypes}
        filters={filters}
        onFilterChange={onFilterChange}
      />

      <div className="space-y-2">
        <Label>徒歩</Label>
        <Select
          value={filters.walkingTime}
          onValueChange={(value) => onFilterChange('walkingTime', value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="指定なし" />
          </SelectTrigger>
          <SelectContent>
            {WALKING_TIME_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <FloorFilters floors={filters.floors} onFilterChange={onFilterChange} />

      <div className="space-y-2">
        <Label>フリーワード</Label>
        <Input
          placeholder={placeholder}
          value={inputValue}
          onChange={onInputChange}
          className="w-full"
        />
      </div>

      <div className="sticky bottom-0 bg-background pb-3">
        <hr />
        <div className="pt-3 text-center">
          <AnimatedNumber value={displayCount} />
          <span className="ml-1">件の該当物件</span>
        </div>
        <div className="my-3 flex justify-center">
          <Button className="w-fit gap-x-1" variant="secondary" size="sm" onClick={onSearch}>
            <img src="/search-icon-primary.svg" alt="検索" className="size-5" />
            この条件で検索
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SearchFilters;
