import { RightSidebarProps } from "@/types/type";
import Color from "../settings/Color";
import Dimensions from "../settings/Dimensions";
import Export from "../settings/Export";
import Text from "../settings/Text";
import { modifyShape } from "@/lib/shapes";
import { useRef } from "react";

export default function RightSidebar({
  elementAttributes,
  setElementAttributes,
  fabricRef,
  isEditingRef,
  activeObjectRef,
  syncShapeInStorage,
}: RightSidebarProps) {
  const colorInputRef = useRef(null);
  const strokeInputRef = useRef(null);
  const handleInputChange = (property: string, value: string) => {
    if (!isEditingRef.current) isEditingRef.current = true;
    setElementAttributes((prevState) => ({
      ...prevState,
      [property]: value,
    }));
    modifyShape({
      canvas: fabricRef.current as fabric.Canvas,
      property,
      value,
      activeObjectRef,
      syncShapeInStorage,
    });
  };
  return (
    <aside className="flex flex-col border-t border-primary-grey-200 bg-primary-black text-primary-grey-300 min-w-56 sticky right-0 h-screen select-none  max-sm:hidden">
      <h3 className="px-5 pt-5 text-xs uppercase">Design</h3>
      <span className="text-xs text-primary-grey-300 mt-3 px-5 border-b border-primary-grey-200 pb-5">
        Make changes to canvas as you like
      </span>
      <Dimensions
        width={elementAttributes.width}
        height={elementAttributes.height}
        handleInputChange={handleInputChange}
        isEditingRef={isEditingRef}
      />
      <Text
        fontFamily={elementAttributes.fontFamily}
        fontSize={elementAttributes.fontSize}
        fontWeight={elementAttributes.fontWeight}
        handleInputChange={handleInputChange}
      />
      <Color
        inputRef={colorInputRef}
        attribute={elementAttributes.fill}
        attributeType="fill"
        placeholder="color"
        handleInputChange={handleInputChange}
      />
      <Color
        inputRef={strokeInputRef}
        attribute={elementAttributes.stroke}
        attributeType="stroke"
        placeholder="stroke"
        handleInputChange={handleInputChange}
      />
      <Export />
    </aside>
  );
}
