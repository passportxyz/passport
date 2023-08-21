import { Tag, TagLabel } from "@chakra-ui/react";

export function OnchainTag({ marginLeft }: { marginLeft?: string }) {
  return (
    <Tag
      marginLeft={`${marginLeft}`}
      bgColor="var(--color-accent-2)"
      textColor="var(--color-text-1)"
      paddingX="8px"
      paddingY="2px"
      rounded="sm"
      size="sm"
    >
      <TagLabel>Onchain</TagLabel>
    </Tag>
  );
}
