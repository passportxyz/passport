import { Tag, TagLabel } from "@chakra-ui/react";

type OnChainBadgeProps = {};

export function OnChainTag({ marginLeft }: { marginLeft?: string }) {
  return (
    <Tag
      marginLeft={`${marginLeft}`}
      bgColor="var(--color-accent-2)"
      textColor="white"
      paddingX="8px"
      paddingY="2px"
      rounded="sm"
      size="sm"
    >
      <TagLabel>On-Chain</TagLabel>
    </Tag>
  );
}
