import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MultiSelect } from "@/components/ui/multi-select";

const options = [
  { value: "a", label: "Source A" },
  { value: "b", label: "Source B" },
];

interface HarnessProps {
  value?: string[];
  onChange?: (next: string[]) => void;
}

function Harness({ value = [], onChange = vi.fn() }: HarnessProps) {
  return (
    <MultiSelect
      value={value}
      onChange={onChange}
      options={options}
      placeholder="All sources"
      selectedLabel={(count) => `${count} selected`}
      ariaLabel="Sources"
    />
  );
}

describe("MultiSelect", () => {
  it("renders the placeholder when nothing is selected", () => {
    render(<Harness />);
    expect(screen.getByRole("button", { name: "Sources" })).toBeInTheDocument();
    expect(screen.getByText("All sources")).toBeInTheDocument();
  });

  it("renders the selected count label when options are selected", () => {
    render(<Harness value={["a", "b"]} />);
    expect(screen.getByText("2 selected")).toBeInTheDocument();
  });

  it("opens the listbox on click and selects an option", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Sources" }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: /Source A/ }));
    expect(onChange).toHaveBeenCalledWith(["a"]);
  });

  it("removes a selected option when toggled again", () => {
    const onChange = vi.fn();
    render(<Harness value={["a"]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Sources" }));
    fireEvent.click(screen.getByRole("option", { name: /Source A/ }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("marks options as selected", () => {
    render(<Harness value={["b"]} />);
    fireEvent.click(screen.getByRole("button", { name: "Sources" }));
    expect(
      screen.getByRole("option", { name: /Source B/ })
    ).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("option", { name: /Source A/ })
    ).toHaveAttribute("aria-selected", "false");
  });

  it("closes on Escape", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Sources" }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole("button", { name: "Sources" }), {
      key: "Escape",
    });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("closes on outside click", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Sources" }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("does not open when disabled", () => {
    render(
      <MultiSelect
        value={[]}
        onChange={vi.fn()}
        options={options}
        placeholder="All sources"
        disabled
        ariaLabel="Sources"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Sources" }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
