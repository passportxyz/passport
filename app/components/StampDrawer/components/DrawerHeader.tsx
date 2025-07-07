import React from "react";
import { Menu, MenuButton, MenuList, MenuItem, IconButton } from "@chakra-ui/react";
import { DrawerHeaderProps } from "../types";

const ThreeDotsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10.0003 10.8327C10.4606 10.8327 10.8337 10.4596 10.8337 9.99935C10.8337 9.53911 10.4606 9.16602 10.0003 9.16602C9.54009 9.16602 9.16699 9.53911 9.16699 9.99935C9.16699 10.4596 9.54009 10.8327 10.0003 10.8327Z"
      stroke="currentColor"
      strokeWidth="1.66667"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10.0003 5.00065C10.4606 5.00065 10.8337 4.62755 10.8337 4.16732C10.8337 3.70708 10.4606 3.33398 10.0003 3.33398C9.54009 3.33398 9.16699 3.70708 9.16699 4.16732C9.16699 4.62755 9.54009 5.00065 10.0003 5.00065Z"
      stroke="currentColor"
      strokeWidth="1.66667"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10.0003 16.6673C10.4606 16.6673 10.8337 16.2942 10.8337 15.834C10.8337 15.3737 10.4606 15.0007 10.0003 15.0007C9.54009 15.0007 9.16699 15.3737 9.16699 15.834C9.16699 16.2942 9.54009 16.6673 10.0003 16.6673Z"
      stroke="currentColor"
      strokeWidth="1.66667"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const DrawerHeader = ({
  icon,
  name,
  website,
  onClose,
  onViewJSON,
  onRemoveAll,
  showMenu,
}: DrawerHeaderProps) => {
  const headerContent = (
    <>
      <img src={icon} alt={name} className="h-10" />
      <h2 className="text-3xl font-medium text-color-4">{name}</h2>
    </>
  );

  return (
    <div className="flex items-center justify-between">
      {website ? (
        <a
          href={website}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          {headerContent}
        </a>
      ) : (
        <div className="flex items-center gap-2">{headerContent}</div>
      )}
      <div className="flex items-center gap-2">
        {showMenu && (onViewJSON || onRemoveAll) && (
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="Platform options"
              icon={<ThreeDotsIcon />}
              size="sm"
              variant="ghost"
              className="!min-w-[32px] !h-[32px] !p-0"
              color="rgb(var(--color-text-2))"
              _hover={{
                bg: "rgba(var(--color-foreground-3), 0.1)",
                color: "rgb(var(--color-text-1))",
              }}
              _active={{
                bg: "rgba(var(--color-foreground-3), 0.2)",
              }}
            />
            <MenuList
              borderColor="rgb(var(--color-foreground-5))"
              bg="rgb(var(--color-foreground))"
              boxShadow="0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
              py={2}
            >
              {onViewJSON && (
                <MenuItem
                  onClick={onViewJSON}
                  _hover={{
                    bg: "rgba(var(--color-foreground-5), 0.1)",
                  }}
                  _focus={{
                    bg: "rgba(var(--color-foreground-5), 0.1)",
                  }}
                  fontSize="sm"
                  color="rgb(var(--color-color-1))"
                  py={3}
                  px={4}
                >
                  View Stamp JSON
                </MenuItem>
              )}
              {onRemoveAll && (
                <MenuItem
                  onClick={onRemoveAll}
                  _hover={{
                    bg: "rgba(var(--color-background-5), 0.2)",
                  }}
                  _focus={{
                    bg: "rgba(var(--color-background-5), 0.2)",
                  }}
                  fontSize="sm"
                  color="rgb(var(--color-color-1))"
                  py={3}
                  px={4}
                >
                  Remove all credentials
                </MenuItem>
              )}
            </MenuList>
          </Menu>
        )}
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full text-color-1 flex items-center justify-center"
          aria-label="Close drawer"
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M24 8L8 24M8 8L24 24"
              stroke="#737373"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
