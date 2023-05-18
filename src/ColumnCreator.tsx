import { For, createSignal } from "solid-js";

export function ColumnCreator() {

    const [columnName, setColumnName] = createSignal("");

    const changeConfigType = (a, b) => {};


	return (
		<>
			<input
				type="checkbox"
				id="column-creation-popup"
				class="modal-toggle"
			/>
			<div class="modal">
				<div class="modal-box relative">
					<label
						for="column-creation-popup"
						class="btn btn-sm btn-circle absolute right-2 top-2"
					>
						✕
					</label>
					<h3 class="font-bold text-lg">Column Creation</h3>
                    <br/>
                    <label class="input-group" for="column-name">
                            <span>Column Name:</span>
                            <input
                                id="column-name"
                                type="text"
                                placeholder="New Column"
                                class="input input-bordered flex-1 bg-base-200"
                                value={columnName()}
                            />
                        </label>
                        <br />
                        <label class="input-group" for="column-type">
                            <span>Column Type:</span>
                            <select
                                id="column-type"
                                class="select select-bordered select-ghost flex-1 bg-base-200"
                                value={"columnType()"}
                                onChange={() => changeConfigType(undefined, columnType)}
                            >
                                <For each={["", "s"]} >
                                    {(i) => {
                                    return <option>{i}</option>
                                }
                                    }
                                </For>
                            </select>
                        </label>
                        <br />

				</div>
			</div>
		</>
	);

}