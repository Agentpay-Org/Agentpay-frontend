import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTable, type DataTableColumn } from "../DataTable";

type Row = { id: string; name: string; amount: number };

const rows: Row[] = [
  { id: "a", name: "Banana", amount: 30 },
  { id: "b", name: "apple", amount: 10 },
  { id: "c", name: "Cherry", amount: 20 },
];

function makeColumns(): DataTableColumn<Row>[] {
  return [
    {
      key: "name",
      header: "Name",
      rowHeader: true,
      sortable: true,
      sortAccessor: (row) => row.name,
      render: (row) => row.name,
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      sortable: true,
      sortAccessor: (row) => row.amount,
      render: (row) => row.amount,
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => <button type="button">Delete {row.id}</button>,
    },
  ];
}

function getBodyRows() {
  return screen.getAllByRole("row").slice(1);
}

function rowNames() {
  return getBodyRows().map((row) => within(row).getAllByRole("cell").length >= 0 && row.querySelector("th")?.textContent);
}

describe("DataTable", () => {
  it("renders a caption", () => {
    render(
      <DataTable
        caption="Widgets"
        columns={makeColumns()}
        data={rows}
        getRowKey={(row) => row.id}
      />
    );
    expect(screen.getByText("Widgets").tagName).toBe("CAPTION");
  });

  it("renders scope=col on every header cell", () => {
    render(
      <DataTable
        caption="Widgets"
        columns={makeColumns()}
        data={rows}
        getRowKey={(row) => row.id}
      />
    );
    const headers = screen.getAllByRole("columnheader");
    expect(headers).toHaveLength(3);
    headers.forEach((header) => {
      expect(header).toHaveAttribute("scope", "col");
    });
  });

  it("renders rowHeader columns as scope=row th cells and other columns as td", () => {
    render(
      <DataTable
        caption="Widgets"
        columns={makeColumns()}
        data={rows}
        getRowKey={(row) => row.id}
      />
    );
    const bodyRows = getBodyRows();
    expect(bodyRows).toHaveLength(3);
    const firstRow = bodyRows[0];
    const rowHeaderCell = within(firstRow).getByRole("rowheader");
    expect(rowHeaderCell).toHaveAttribute("scope", "row");
    expect(rowHeaderCell).toHaveTextContent("Banana");
    expect(within(firstRow).getAllByRole("cell")).toHaveLength(2);
  });

  it("does not render a sort button or aria-sort for non-sortable columns", () => {
    render(
      <DataTable
        caption="Widgets"
        columns={makeColumns()}
        data={rows}
        getRowKey={(row) => row.id}
      />
    );
    const actionsHeader = screen.getByRole("columnheader", { name: "Actions" });
    expect(actionsHeader).not.toHaveAttribute("aria-sort");
    expect(within(actionsHeader).queryByRole("button")).not.toBeInTheDocument();
  });

  it("marks sortable-but-inactive columns with aria-sort=none", () => {
    render(
      <DataTable
        caption="Widgets"
        columns={makeColumns()}
        data={rows}
        getRowKey={(row) => row.id}
      />
    );
    expect(screen.getByRole("columnheader", { name: /name/i })).toHaveAttribute(
      "aria-sort",
      "none"
    );
    expect(
      screen.getByRole("columnheader", { name: /amount/i })
    ).toHaveAttribute("aria-sort", "none");
  });

  it("renders rows unsorted by default in the given data order", () => {
    render(
      <DataTable
        caption="Widgets"
        columns={makeColumns()}
        data={rows}
        getRowKey={(row) => row.id}
      />
    );
    expect(rowNames()).toEqual(["Banana", "apple", "Cherry"]);
  });

  it("sorts ascending on first click and reflects aria-sort=ascending", async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        caption="Widgets"
        columns={makeColumns()}
        data={rows}
        getRowKey={(row) => row.id}
      />
    );

    await user.click(screen.getByRole("button", { name: /name/i }));

    expect(rowNames()).toEqual(["apple", "Banana", "Cherry"]);
    expect(screen.getByRole("columnheader", { name: /name/i })).toHaveAttribute(
      "aria-sort",
      "ascending"
    );
  });

  it("toggles to descending on a second click of the same column", async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        caption="Widgets"
        columns={makeColumns()}
        data={rows}
        getRowKey={(row) => row.id}
      />
    );

    const nameButton = screen.getByRole("button", { name: /name/i });
    await user.click(nameButton);
    await user.click(nameButton);

    expect(rowNames()).toEqual(["Cherry", "Banana", "apple"]);
    expect(screen.getByRole("columnheader", { name: /name/i })).toHaveAttribute(
      "aria-sort",
      "descending"
    );
  });

  it("switches the active sort column back to ascending when a different column is clicked", async () => {
    const user = userEvent.setup();
    render(
      <DataTable
        caption="Widgets"
        columns={makeColumns()}
        data={rows}
        getRowKey={(row) => row.id}
      />
    );

    await user.click(screen.getByRole("button", { name: /name/i }));
    await user.click(screen.getByRole("button", { name: /amount/i }));

    expect(screen.getByRole("columnheader", { name: /amount/i })).toHaveAttribute(
      "aria-sort",
      "ascending"
    );
    expect(screen.getByRole("columnheader", { name: /name/i })).toHaveAttribute(
      "aria-sort",
      "none"
    );
    expect(rowNames()).toEqual(["apple", "Cherry", "Banana"]);
  });

  it("sorts numeric columns numerically, not lexicographically", async () => {
    const user = userEvent.setup();
    const numericRows: Row[] = [
      { id: "x", name: "x", amount: 9 },
      { id: "y", name: "y", amount: 80 },
      { id: "z", name: "z", amount: 700 },
    ];
    render(
      <DataTable
        caption="Widgets"
        columns={makeColumns()}
        data={numericRows}
        getRowKey={(row) => row.id}
      />
    );

    await user.click(screen.getByRole("button", { name: /amount/i }));

    const bodyRows = getBodyRows();
    const amounts = bodyRows.map(
      (row) => within(row).getAllByRole("cell")[0].textContent
    );
    expect(amounts).toEqual(["9", "80", "700"]);
  });

  it("respects defaultSortKey and defaultSortDirection on initial render", () => {
    render(
      <DataTable
        caption="Widgets"
        columns={makeColumns()}
        data={rows}
        getRowKey={(row) => row.id}
        defaultSortKey="amount"
        defaultSortDirection="descending"
      />
    );

    expect(
      screen.getByRole("columnheader", { name: /amount/i })
    ).toHaveAttribute("aria-sort", "descending");
    expect(rowNames()).toEqual(["Banana", "Cherry", "apple"]);
  });

  it("keeps equal sort values in their original relative order (stable sort)", async () => {
    const user = userEvent.setup();
    const tiedRows: Row[] = [
      { id: "1", name: "tie", amount: 5 },
      { id: "2", name: "tie", amount: 5 },
      { id: "3", name: "tie", amount: 5 },
    ];
    render(
      <DataTable
        caption="Widgets"
        columns={makeColumns()}
        data={tiedRows}
        getRowKey={(row) => row.id}
      />
    );

    await user.click(screen.getByRole("button", { name: /name/i }));

    const bodyRows = getBodyRows();
    const ids = bodyRows.map((row) =>
      within(row).getByRole("button").textContent
    );
    expect(ids).toEqual(["Delete 1", "Delete 2", "Delete 3"]);
  });

  it("renders no body rows for empty data while keeping the header", () => {
    render(
      <DataTable
        caption="Widgets"
        columns={makeColumns()}
        data={[]}
        getRowKey={(row) => row.id}
      />
    );
    expect(getBodyRows()).toHaveLength(0);
    expect(screen.getAllByRole("columnheader")).toHaveLength(3);
  });

  it("passes row and index through to render and getRowKey", () => {
    const getRowKey = jest.fn((row: Row) => row.id);
    const columns: DataTableColumn<Row>[] = [
      {
        key: "index",
        header: "Index",
        render: (row, index) => `${index}:${row.id}`,
      },
    ];
    render(
      <DataTable caption="Widgets" columns={columns} data={rows} getRowKey={getRowKey} />
    );

    expect(screen.getByText("0:a")).toBeInTheDocument();
    expect(screen.getByText("1:b")).toBeInTheDocument();
    expect(screen.getByText("2:c")).toBeInTheDocument();
    expect(getRowKey).toHaveBeenCalledWith(rows[0], 0);
    expect(getRowKey).toHaveBeenCalledWith(rows[2], 2);
  });

  it("applies the align prop as a text alignment class", () => {
    render(
      <DataTable
        caption="Widgets"
        columns={makeColumns()}
        data={rows}
        getRowKey={(row) => row.id}
      />
    );
    expect(screen.getByRole("columnheader", { name: /amount/i }).className).toContain(
      "text-right"
    );
  });

  it("merges a custom className onto the scroll wrapper", () => {
    const { container } = render(
      <DataTable
        caption="Widgets"
        columns={makeColumns()}
        data={rows}
        getRowKey={(row) => row.id}
        className="my-extra-class"
      />
    );
    expect(container.firstChild).toHaveClass("my-extra-class");
    expect(container.firstChild).toHaveClass("overflow-x-auto");
  });
});
