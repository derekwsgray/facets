/*
 *  Copyright (c) 2020 Uncharted Software Inc.
 *  http://www.uncharted.software/
 *
 *   Permission is hereby granted, free of charge, to any person obtaining a copy of
 *  this software and associated documentation files (the "Software"), to deal in
 *  the Software without restriction, including without limitation the rights to
 *  use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 *  of the Software, and to permit persons to whom the Software is furnished to do
 *  so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in all
 *  copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *  SOFTWARE.
 *
 */

import {css, CSSResult, html, TemplateResult, unsafeCSS} from 'lit';
import {repeat} from 'lit/directives/repeat.js';
import {FacetContainer} from '../facet-container/FacetContainer';
import {FacetBarsValueData, kFacetVarsValueNullData} from '../facet-bars-value/FacetBarsValue';

// @ts-ignore
import facetBarsBaseStyle from './FacetBarsBase.css';
import {preHTML} from '../tools/preHTML';
import {FacetTemplate} from '..';
import {polyMatches} from '../tools/PolyMatches';

export interface FacetBarsValueDataTyped extends FacetBarsValueData {
    type?: string;
}
export interface FacetBarsBaseData { [key: number]: FacetBarsValueDataTyped | null }
export interface FacetBarsBaseSubselection { [key: number]: number|number[] }

export interface FacetBarsFilterValue {
    value: number;
    label: string;
}

export type FacetBarsFilterEdge = number | FacetBarsFilterValue;

export const kFacetBarsBaseDefaultValues: FacetBarsBaseData = [null, null, null, null, null, null, null, null, null, null];
export const kFacetBarsBaseNullView: [number, number] = [null as unknown as number, null as unknown as number];
export const kFacetBarsBaseNullDomain: [number, number] = [null as unknown as number, null as unknown as number];

const kRangeValueHasChanged = (newVal: [number, number], oldVal: [number, number]): boolean => {
    if (!oldVal || !newVal) {
        return oldVal !== newVal;
    }
    return newVal[0] !== oldVal[0] || newVal[1] !== oldVal[1];
};

const kGetFilterValue = function kGetFilterValue(filter: [FacetBarsFilterEdge, FacetBarsFilterEdge], index: number): number {
    return isNaN(filter[index] as number) ? (filter[index] as FacetBarsFilterValue).value : filter[index] as number;
};

const kFilterValueHasChanged = (newVal: [FacetBarsFilterEdge, FacetBarsFilterEdge], oldVal: [FacetBarsFilterEdge, FacetBarsFilterEdge]): boolean => {
    if (kRangeValueHasChanged(newVal as [number, number], oldVal as [number, number])) {
        if (newVal && oldVal) {
            const newVal0 = kGetFilterValue(newVal, 0);
            const newVal1 = kGetFilterValue(newVal, 1);
            const oldVal0 = kGetFilterValue(oldVal, 0);
            const oldVal1 = kGetFilterValue(oldVal, 1);

            return newVal0 !== oldVal0 || newVal1 !== oldVal1;
        }
        return true;
    }
    return false;
};
/* should not be instantiated as a custom element */
export class FacetBarsBase extends FacetContainer {
    public static get styles(): CSSResult[] {
        const styles = this.getSuperStyles();
        styles.push(css`
            ${unsafeCSS(facetBarsBaseStyle)}
        `);
        return styles;
    }

    public static get properties(): any {
        return {
            values: { type: Object },
            domain: { type: Array, hasChanged: kRangeValueHasChanged },
            view: { type: Array, hasChanged: kRangeValueHasChanged },
            filter: { type: Array, hasChanged: kFilterValueHasChanged },
            selection: { type: Array, hasChanged: kRangeValueHasChanged },
            subselection: { type: Array },
            actionButtons: { type: Number, attribute: 'action-buttons' }
        };
    }

    public filter: [FacetBarsFilterEdge, FacetBarsFilterEdge] | null = null;
    public selection: [number, number] | null = null;
    public subselection: FacetBarsBaseSubselection | null = null;
    public actionButtons: number = 0;

    private _values: FacetBarsBaseData = kFacetBarsBaseDefaultValues;
    public get values(): FacetBarsBaseData {
        return this._values;
    }
    public set values(newData: FacetBarsBaseData) {
        const oldData = this._values;
        this._values = newData;
        this.valueKeys = Object.keys(this._values).map((key: string): number => parseInt(key, 10));
        this.valueKeys.sort((a: number, b: number): number => a - b);
        this.requestUpdate('values', oldData);
    }

    private _domain: [number, number] = kFacetBarsBaseNullDomain;
    // @ts-ignore
    public get domain(): [number, number] {
        if (this._domain === kFacetBarsBaseNullDomain || this._domain === this.nullDomain) {
            if (this.valueKeys.length) {
                this.nullDomain[0] = this.valueKeys[0];
                this.nullDomain[1] = this.valueKeys[this.valueKeys.length - 1] + 1;
            } else {
                this.nullDomain[0] = 0;
                this.nullDomain[1] = 0;
            }
            this._domain = this.nullDomain;
        }
        return this._domain;
    }
    // @ts-ignore
    public set domain(value: [number, number] | null) {
        const oldValue = this._domain;
        if (!value || value === kFacetBarsBaseNullDomain || value === this.nullDomain) {
            this._domain = this.nullDomain;
        } else {
            this._domain = [Math.max(value[0], 0), Math.max(value[1], 0)];
        }
        this.requestUpdate('domain', oldValue);
    }

    private _view: [number, number] = kFacetBarsBaseNullView;
    // @ts-ignore
    public get view(): [number, number] {
        if (this._view === kFacetBarsBaseNullView || this._view === this.nullView) {
            const domain = this.domain;
            this.nullView[0] = Math.floor(domain[0]);
            this.nullView[1] = Math.ceil(domain[1]);
            this._view = this.nullView;
        }
        return this._view;
    }
    // @ts-ignore
    public set view(value: [number, number] | null) {
        const oldValue = this._view;
        if (!value || value === kFacetBarsBaseNullView || value === this.nullView) {
            this._view = this.nullView;
        } else {
            this._view = [Math.max(value[0], 0), Math.max(value[1], 0)];
        }
        this.requestUpdate('view', oldValue);
    }

    private _activeView: [number, number] = this._view;
    private get activeView(): [number, number] {
        if (this._activeView === kFacetBarsBaseNullView) {
            if (this._activeView !== this._view) {
                return this.view;
            } else if (this.valueKeys.length) {
                const domain = this.domain;
                return [Math.floor(domain[0]), Math.ceil(domain[1])];
            }
            return [0, 0];
        }
        return this._activeView;
    }

    private _hover: boolean = false;
    public get hover(): boolean {
        return this._hover;
    }
    public set hover(value: boolean) {
        const oldValue = this._hover;
        this._hover = value;
        this.requestUpdate('hover', oldValue);
    }

    public get filterIndices(): [number, number] | null {
        const filter = this.filter;
        if (!filter) {
            return null;
        }
        const filter0 = Math.floor(kGetFilterValue(filter, 0));
        const filter1 = Math.floor(kGetFilterValue(filter, 1));

        return [filter0, filter1];
    }

    public get filterValues(): [number, number] | null {
        const filter = this.filter;
        if (!filter) {
            return null;
        }
        const filter0 = kGetFilterValue(filter, 0);
        const filter1 = kGetFilterValue(filter, 1);

        return [filter0, filter1];
    }

    public get barAreaElement(): HTMLElement | null {
        return this.slottedElements.get('values') || null;
    }

    public get barValueTheme(): string {
        return 'default';
    }

    private readonly nullDomain: [number, number] = [0, 0];
    private readonly nullView: [number, number] = [0, 0];

    private valueKeys: number[] = Object.keys(kFacetBarsBaseDefaultValues).map((key: string): number => parseInt(key, 10));
    private viewValues: FacetBarsBaseData = {};

    public connectedCallback(): void {
        super.connectedCallback();
        const values = this.createSlottedElement('values');
        if (values) {
            values.setAttribute('class', 'facet-bars-base-container');
        }
    }

    protected renderSlottedElements(): void {
        super.renderSlottedElements();
        const values = this.slottedElements.get('values');
        if (values) {
            this.renderSlottedElement(this.renderValues() || html``, values);
        }
    }

    protected setTemplateForTarget(target: string, template: FacetTemplate): void {
        super.setTemplateForTarget(target, template);
        template.addCustomAttribute('id');
        template.addCustomAttribute('theme');
        template.addCustomAttribute('facet-value-state');
        template.addCustomAttribute('action-buttons');
        template.addCustomAttribute('contrast');
        template.addCustomAttribute('.values');
        template.addCustomAttribute('.clipLeft');
        template.addCustomAttribute('.clipRight');
    }

    protected renderContent(): TemplateResult {
        return html`
        <div
            class="facet-bars-base-values-container"
            @mouseenter="${this.handleMouseEvent}"
            @mouseleave="${this.handleMouseEvent}"
        >
            <slot name="values"></slot>
        </div>
        `;
    }

    protected renderValues(): TemplateResult | void {
        const actionButtons = this.actionButtons.toString();
        const view: [number, number] = this.view;
        const values = this._values;
        const htmlTemplate = this.getValuesHTML(
            this._getViewValues(values, view),
            actionButtons,
            view[0]
        );

        this._activeView = view;
        this.viewValues = values;

        return html`${htmlTemplate}`;
    }

    protected getValuesHTML(
        values: (FacetBarsValueData|null)[],
        actionButtons: string,
        offset: number
    ): ReturnType<typeof repeat> {
        const theme = this.barValueTheme;
        const contrast = this.hover;
        let id = 0;
        const keyFunction = (): number => (id++) + offset;
        const htmlFunction = (value: FacetBarsValueDataTyped|null, i: number): TemplateResult => {
            const computedState = this.computeValueState(i + offset);
            const subselection = this.subselection ? this.subselection[i + offset] : null;
            const overrideState = value === null || value.ratio === null ? 'loading' : null;
            const type = value && value.type || 'facet-bars-value';
            const template = this.templates.get(type);
            const valuesArray = this.computeValuesArray(value || kFacetVarsValueNullData, subselection);
            const domain = this.domain;
            const clipLeft = i < domain[0] ? domain[0] - Math.floor(domain[0]) : 0;
            const clipRight = i + 1 > domain[1] ? (i + 1) - domain[1] : 0;

            if (template) {
                return template.generateTemplate(value || kFacetVarsValueNullData, {
                    'id': i + offset,
                    'theme': theme,
                    'facet-value-state': overrideState !== null ? overrideState : computedState,
                    'action-buttons': actionButtons,
                    'contrast': contrast,
                    '.values': valuesArray,
                    '.clipLeft': clipLeft,
                    '.clipRight': clipRight
                });
            } else if (type === 'facet-bars-value') {
                return html`
                <facet-bars-value
                    id="${i + offset}"
                    theme="${theme}"
                    facet-value-state="${overrideState !== null ? overrideState : computedState}"
                    action-buttons="${actionButtons}"
                    contrast="${contrast}"
                    .values="${valuesArray}"
                    .data="${value || kFacetVarsValueNullData}"
                    .clipLeft="${clipLeft}"
                    .clipRight="${clipRight}">
                </facet-bars-value>`;
            }
            return preHTML`
            <${type}
                id="${i + offset}"
                theme="${theme}"
                facet-value-state="${overrideState !== null ? overrideState : computedState}"
                action-buttons="${actionButtons}"
                contrast="${contrast}"
                .values="${valuesArray}"
                .data="${value || kFacetVarsValueNullData}"
                .clipLeft="${clipLeft}"
                .clipRight="${clipRight}">
            </${type}>`;
        };

        return repeat(values, keyFunction, htmlFunction);
    }

    protected computeValueState(barIndex: number): string {
        let result = 'normal';
        if (this.selection) {
            if (barIndex >= Math.floor(this.selection[0]) && barIndex < Math.ceil(this.selection[1])) {
                result = 'selected';
            } else {
                result = 'unselected';
            }
        }

        if (this.filter) {
            const min = Math.floor(kGetFilterValue(this.filter, 0));
            const max = Math.ceil(kGetFilterValue(this.filter, 1));
            if (barIndex < min || barIndex >= max) {
                result = 'muted';
            }
        }

        return result;
    }

    private handleMouseEvent(event: MouseEvent): void {
        if ((event.type === 'mouseenter' || event.type === 'mouseleave') && event.target instanceof Element) {
            this.hover = polyMatches(event.target, ':hover');
        }
    }

    private computeValuesArray(value: FacetBarsValueDataTyped|null, subselection: number|number[]|null): (number|null)[] {
        const result: (number|null)[] = [];
        if (value) {
            result.push(value.ratio);
            if (subselection !== null) {
                const sub = Array.isArray(subselection) ? subselection : [subselection];
                result.push(...sub);
            }
        }
        return result;
    }

    private _getViewValues(values: FacetBarsBaseData, view: [number, number]): (FacetBarsValueData|null)[] {
        const result: (FacetBarsValueData|null)[] = [];
        for (let i = view[0], n = view[view.length - 1]; i < n; ++i) {
            if (values[i]) {
                result.push(values[i]);
            } else {
                result.push(null);
            }
        }
        return result;
    }
}
