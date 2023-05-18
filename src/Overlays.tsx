import { ColumnCreator } from './ColumnCreator';
import { SheetCreator } from './SheetCreator'
// import { Match, Switch, createSignal } from 'solid-js';

export function Overlays() {
    return (
        <>
            <SheetCreator/>
            <ColumnCreator/>
        </>
	);
}
