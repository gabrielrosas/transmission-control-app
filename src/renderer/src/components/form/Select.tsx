import { cn } from '@renderer/libs/cn'
import SelectBase, { type Props, type ClassNamesConfig, GroupBase } from 'react-select'

export type Option = {
  label: string
  value: string
}

type SelectProps = Omit<
  Props<Option, false>,
  'classNames' | 'className' | 'styles' | 'classNamePrefix' | 'isMulti'
> & {}

export function Select({ ...props }: SelectProps) {
  const classNames: ClassNamesConfig<Option, false, GroupBase<Option>> = {
    container: () => cn('!outline-none !w-full'),
    control: () => cn('!bg-background !border !border-border !rounded-md !shadow-none'),
    input: () => '!text-white !px-2 !py-1',
    indicatorSeparator: () => '!bg-border',
    menu: () => '!border !border-border !bg-secondary !rounded-md !overflow-hidden',
    option: (state) => {
      return state.isFocused ? '!bg-primary' : '!bg-background'
    },
    singleValue: ({ isDisabled }) => (isDisabled ? '!text-white' : '!text-white'),
    placeholder: () => '!text-neutral-400',
    clearIndicator: () => '!text-neutral-400 hover:!text-white !cursor-pointer',
    dropdownIndicator: () => '!text-neutral-400 hover:!text-white !cursor-pointer'
  }
  return <SelectBase {...props} classNames={classNames} isMulti={false} />
}
