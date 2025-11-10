import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  id?: string;
  label?: string;
  placeholder?: string;
  value?: string;
  onChange: (date: string) => void;
  required?: boolean;
  disabled?: boolean;
  showLabelOutside?: boolean;
  allowManualInput?: boolean;
}

export function DatePicker({
  id,
  label,
  placeholder,
  value,
  onChange,
  required = false,
  disabled = false,
  showLabelOutside = true,
  allowManualInput = false,
}: DatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(
    value ? new Date(value) : undefined
  );
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState<string>("");
  const [inputError, setInputError] = React.useState<boolean>(false);

  // Sync internal state with external value prop
  React.useEffect(() => {
    const newDate = value ? new Date(value) : undefined;
    setDate(newDate);
    if (newDate && allowManualInput) {
      setInputValue(format(newDate, "dd/MM/yyyy"));
    } else if (!value) {
      setInputValue("");
    }
  }, [value, allowManualInput]);

  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      onChange(format(selectedDate, "yyyy-MM-dd"));
      if (allowManualInput) {
        setInputValue(format(selectedDate, "dd/MM/yyyy"));
      }
    } else {
      onChange("");
      if (allowManualInput) {
        setInputValue("");
      }
    }
    setIsOpen(false);
    setInputError(false);
  };

  const handleManualInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, '');
    
    // Auto-format with slashes
    let formatted = '';
    if (numbers.length > 0) {
      formatted = numbers.slice(0, 2); // DD
      if (numbers.length >= 3) {
        formatted += '/' + numbers.slice(2, 4); // MM
      }
      if (numbers.length >= 5) {
        formatted += '/' + numbers.slice(4, 8); // YYYY
      }
    }
    
    setInputValue(formatted);
    setInputError(false);

    // Validate on complete format
    if (formatted.length === 10) {
      const parsedDate = parse(formatted, "dd/MM/yyyy", new Date());
      if (isValid(parsedDate)) {
        setDate(parsedDate);
        onChange(format(parsedDate, "yyyy-MM-dd"));
        setInputError(false);
      } else {
        setInputError(true);
      }
    } else if (formatted.length === 0) {
      setDate(undefined);
      onChange("");
    }
  };

  const displayPlaceholder = placeholder || label || "Select date";
  const isFloating = isOpen || !!date || !!inputValue;
  
  if (showLabelOutside) {
    if (allowManualInput) {
      return (
        <div className="space-y-1">
          {label && (
            <label htmlFor={id} className="text-sm font-medium text-foreground">
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </label>
          )}
          <div className="relative">
            <Input
              id={id}
              type="text"
              placeholder={inputValue ? "" : "DD/MM/YYYY"}
              value={inputValue}
              onChange={handleManualInput}
              disabled={disabled}
              maxLength={10}
              className={cn(
                "h-9 pr-10",
                inputError && "border-destructive focus-visible:ring-destructive"
              )}
            />
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-9 w-10 hover:bg-muted"
                  disabled={disabled}
                >
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleSelect}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          {inputError && (
            <p className="text-xs text-destructive">Invalid date format. Use DD/MM/YYYY</p>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-foreground">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              id={id}
              variant="outline"
              className={cn(
                "w-full h-14 justify-start text-left font-normal bg-background hover:bg-background/80 transition-all",
                !date && "text-muted-foreground"
              )}
              disabled={disabled}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>{displayPlaceholder}{required && <span className="text-destructive ml-1">*</span>}</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleSelect}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  // Floating label variant with manual input
  if (allowManualInput) {
    return (
      <div className="relative">
        <div className="relative">
          <Input
            id={id}
            type="text"
            placeholder=""
            value={inputValue}
            onChange={handleManualInput}
            onFocus={() => setIsOpen(false)}
            disabled={disabled}
            maxLength={10}
            className={cn(
              "h-12 pl-10 pr-10 peer",
              inputError && "border-destructive focus-visible:ring-destructive"
            )}
          />
          <CalendarIcon className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none",
            isFloating && "text-primary"
          )} />
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-12 w-10 hover:bg-muted"
                disabled={disabled}
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white z-50" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleSelect}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          <label
            htmlFor={id}
            className={cn(
              "absolute left-10 text-sm transition-all pointer-events-none duration-200 ease-out",
              isFloating
                ? "-top-2.5 left-3 text-xs px-1 bg-white text-primary"
                : "top-3 text-muted-foreground"
            )}
          >
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        </div>
        {inputError && (
          <p className="text-xs text-destructive mt-1">Invalid date format. Use DD/MM/YYYY</p>
        )}
      </div>
    );
  }

  // Floating label variant (calendar only)
  return (
    <div className="relative">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            className={cn(
              "w-full h-12 justify-start text-left font-normal bg-white hover:bg-white transition-all pl-10 pr-3",
              !date && "text-transparent",
              isOpen ? "border-primary ring-2 ring-primary/20" : "border-input"
            )}
            disabled={disabled}
          >
            <CalendarIcon className={cn("absolute left-3 h-4 w-4", date ? "text-foreground" : "text-muted-foreground")} />
            <span className={cn(date ? "text-foreground" : "text-transparent")}>
              {date ? format(date, "dd-MM-yyyy") : "placeholder"}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white z-50" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
      <label
        htmlFor={id}
        className={cn(
          "absolute left-10 text-sm transition-all pointer-events-none duration-200 ease-out",
          isFloating
            ? "-top-2.5 left-3 text-xs px-1 bg-white text-primary"
            : "top-3 text-muted-foreground"
        )}
      >
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
    </div>
  );
}
