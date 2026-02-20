import React from 'react';
import { Card, CardContent } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Table, TableBody, TableCell, TableRow } from '~/components/ui/table';
import { Link } from '@remix-run/react';

interface PropertyCardProps {
  id: string;
  areaSlug?: string;
  image: string;
  title: string;
  price: string;
  address: string;
  size: string;
  distance: string;
  isFavorite: boolean;
  isNew?: boolean;
  isSkeleton?: boolean;
  isInteriorIncluded?: boolean;
  variant?: 'default' | 'detailed';
  details: Array<{ label: string; value: string }>;
  registrationDate: string;
}

const DefaultCard: React.FC<PropertyCardProps> = ({
  id,
  areaSlug,
  image,
  title,
  price,
  address,
  size,
  distance,
  isNew,
  isSkeleton,
  isInteriorIncluded,
}) => (
  <Card className="w-[calc((100%-12px)/2)] overflow-hidden lg:w-[calc((100%-40px)/3)]">
    <Link to={`/${areaSlug}/properties/${id}`}>
      <img
        src={image}
        alt=""
        className="h-[118px] w-full object-cover lg:h-[188px]"
        width="177"
        height="118"
      />
      <CardContent className="p-3">
        <div className="space-y-2 lg:space-y-3">
          <div className="space-x-3">
            {isNew && <Badge variant="new">NEW</Badge>}
            {isSkeleton && <Badge variant="skeleton">スケルトン</Badge>}
            {isInteriorIncluded && <Badge variant="equipped">居抜き</Badge>}
          </div>
          <h3 className="text-sm font-medium lg:text-base">{title}</h3>
          <ul className="space-y-1">
            <li className="flex items-center gap-x-1">
              <img src="/address-icon.svg" alt="" width="22" height="22" />
              <span className="text-xs lg:text-sm">{address}</span>
            </li>
            <li className="flex items-center gap-x-1">
              <img src="/distance-icon.svg" alt="" width="22" height="22" />
              <span className="text-xs lg:text-sm">{distance}</span>
            </li>
            <li className="flex items-center gap-x-1">
              <img src="/price-icon.svg" alt="" width="22" height="22" />
              <span className="text-xs lg:text-sm">{price}</span>
            </li>
            <li className="flex items-center gap-x-1">
              <img src="/size-icon.svg" alt="" width="22" height="22" />
              <span className="text-xs lg:text-sm">{size}</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Link>
  </Card>
);

const DetailedCard: React.FC<PropertyCardProps> = ({
  id,
  areaSlug,
  image,
  title,
  details,
  isNew,
  isSkeleton,
  isInteriorIncluded,
  registrationDate,
}) => (
  <Card className="overflow-hidden">
    <Link to={`/${areaSlug}/properties/${id}`}>
      <CardContent className="space-y-3 p-3">
        <div className="space-y-3">
          <div className="space-x-3">
            {isNew && <Badge variant="new">NEW</Badge>}
            {isSkeleton && <Badge variant="skeleton">スケルトン</Badge>}
            {isInteriorIncluded && <Badge variant="equipped">居抜き</Badge>}
          </div>
          <h3 className="m-0 p-0 text-sm font-medium lg:text-base">{title}</h3>
        </div>
        <div className="flex items-start gap-x-[10px] lg:gap-x-5">
          <div className="w-5/12 lg:w-2/5">
            <img
              src={image}
              alt=""
              className="aspect-video w-full object-cover"
              width="146"
              height="93"
            />
            <span className="text-xs text-[#7A7A7A] lg:hidden">登録日：{registrationDate}</span>
          </div>
          <div className="flex-1 space-y-2">
            <Table>
              <TableBody>
                {details?.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="w-fit whitespace-pre bg-gray-100 px-2 text-center text-xs lg:text-sm">
                      {item.label}
                    </TableCell>
                    <TableCell className="w-fit whitespace-pre-line text-xs lg:w-7/12 lg:text-base">
                      {item.value}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        <div className="flex items-center gap-x-[10px] lg:items-end lg:gap-x-5">
          <span className="hidden w-2/5 text-xs text-[#7A7A7A] lg:inline-block">
            登録日：{registrationDate}
          </span>
          <Button variant="default" size="sm" className="w-full lg:flex-1">
            お問い合わせ
          </Button>
        </div>
      </CardContent>
    </Link>
  </Card>
);

export const PropertyCard: React.FC<PropertyCardProps> = (props) => {
  const { variant = 'detailed', ...otherProps } = props;

  if (variant === 'default') {
    return <DefaultCard {...otherProps} />;
  }

  return <DetailedCard {...otherProps} />;
};

export default PropertyCard;
