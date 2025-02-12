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

import {FacetPlugin} from '../../FacetPlugin';
import {FacetBarsValueData} from '../../../facet-bars-value/FacetBarsValue';
import {FacetBarsBase} from '../../../facet-bars-base/FacetBarsBase';
import {css, CSSResult, html, TemplateResult, unsafeCSS} from 'lit';

// @ts-ignore
import FacetBarsLabelsStyle from './FacetBarsLabels.css';

interface LabelSection {
    label: string|null;
    min: number;
    max: number;
}

interface LabelRow {
    ticks: TemplateResult[];
    labels: TemplateResult[];
    sections: LabelSection[];

    section: LabelSection|null;
}

const kBooleanConverter = {
    fromAttribute: (value: string): boolean => {
        try {
            return JSON.parse(value);
        } catch (_error) {
            return Boolean(value);
        }
    },
    toAttribute: (value: boolean): string => JSON.stringify(Boolean(value))
};

export class FacetBarsLabels extends FacetPlugin {
    public static get styles(): CSSResult[] {
        return [
            css`${unsafeCSS(FacetBarsLabelsStyle)}`
        ];
    }

    public static get properties(): any {
        return {
            automaticLabels: {
                type: Boolean,
                attribute: 'automatic-labels',
                converter: kBooleanConverter
            },
            drawDelimiters: {
                type: Boolean,
                attribute: 'draw-delimiters',
                converter: kBooleanConverter
            }
        };
    }

    public automaticLabels: boolean = false;
    public drawDelimiters: boolean = true;

    private facet: FacetBarsBase | null = null;
    private labelCanvas: HTMLCanvasElement = document.createElement('canvas');
    private labelContext: CanvasRenderingContext2D = this.labelCanvas.getContext('2d') as CanvasRenderingContext2D;

    protected hostUpdated(changedProperties: Map<PropertyKey, unknown>): void {
        super.hostUpdated(changedProperties);
        if (changedProperties.has('view') || changedProperties.has('domain') || changedProperties.has('data')) {
            this.requestUpdate();
        }
    }

    protected hostChanged(host: HTMLElement|null): void {
        if (host instanceof FacetBarsBase) {
            this.facet = host;
        } else {
            this.facet = null;
        }
    }

    protected render(): TemplateResult | void {
        const facet = this.facet;
        if (facet) {
            const rows: LabelRow[] = [];
            const barArea = facet.barAreaElement;
            if (barArea) {
                const view = facet.view;
                const values = facet.values;
                const viewLength = view[1] - view[0];
                const width = barArea.scrollWidth;
                const barStep = width / viewLength;
                const barStepPercentage = 100 / viewLength;

                for (let i = -1, v = view[0] - 1, n = view[1]; v <= n; ++i, ++v) {
                    this._processValue(values[v], rows, this.automaticLabels, v, i, barStepPercentage);
                }

                for (let i = 0, n = rows.length; i < n; ++i) {
                    this._processRow(rows[i], width, barStep, barStepPercentage);
                }
            } else {
                requestAnimationFrame(() => {
                    facet.requestUpdate();
                    return Promise.resolve();
                });
            }

            const result: TemplateResult[] = [];
            for (let i = 0, n = rows.length; i < n; ++i) {
                result.push(html`
                <div class="facet-bars-labels-row">
                    ${rows[i].ticks.length ? html`<div class="facet-bars-labels-ticks">${rows[i].ticks}</div>` : undefined}
                    ${rows[i].labels.length ? html`<div class="facet-bars-labels-text">${rows[i].labels}</div>` : undefined}
                </div>
                `);
            }

            return html`${result}`;
        }
        return html`${undefined}`;
    }

    private _processValue(value: FacetBarsValueData|null, rows: LabelRow[], drawIndexLabels: boolean, valueIndex: number, barIndex: number, barStepPercentage: number): void {
        const labels = this._getLabels(value, valueIndex, drawIndexLabels);
        const percentagePosition = (barStepPercentage * barIndex).toFixed(2);
        if (labels) {
            let row;
            let label;

            for (let i = 0, n = Math.max(labels.length, rows.length); i < n; ++i) {
                if (rows.length < i + 1) {
                    rows.push({
                        ticks: [],
                        labels: [],
                        sections: [],
                        section: null
                    });
                }

                row = rows[i];
                label = labels[i];

                if (!label) {
                    this._capRow(rows[i], percentagePosition);
                } else if (row.section && row.section.label === label) {
                    row.section.max = barIndex + 1;
                } else {
                    row.section = {
                        label,
                        min: barIndex,
                        max: barIndex + 1
                    };
                    row.sections.push(row.section);
                    if (label && this.drawDelimiters && barIndex >= 0) {
                        row.ticks.push(html`<div class="facet-bars-labels-tick" id="${valueIndex}" style="left:${percentagePosition}%"></div>`);
                    }
                }
            }
        } else {
            this._capRows(rows, percentagePosition);
        }
    }

    private _processRow(row: LabelRow, width: number, barStep: number, barStepPercentage: number): void {
        const padding = 3;
        const halfBar = barStep * 0.5;
        const maxBars = Math.round(width / barStep);
        let left = 0;
        let right = width;
        let center;
        let offset;
        let pixelWidth;
        let halfPixelWidth;
        let section;
        let position;
        let pixelMin;
        let pixelMax;
        if (row.sections.length) {
            for (let l = 0, r = row.sections.length - 1, n = (l + r) * 0.5; l <= n; ++l, --r) {
                /* left */
                section = row.sections[l];
                if (section.label && section.max > 0) {
                    pixelWidth = this._computeLabelWidth(section.label);
                    halfPixelWidth = pixelWidth * 0.5 + padding;
                    pixelMin = Math.max(section.min * barStep + halfBar, 0);
                    pixelMax = Math.min(section.max * barStep - halfBar, width);
                    center = (pixelMin + pixelMax) * 0.5;
                    if (left === 0 || (center - halfPixelWidth >= left && center + halfPixelWidth <= right)) {
                        this._addMarker(section, barStepPercentage, row.ticks);
                        position = ((center / width) * 100).toFixed(2);
                        offset = Math.round(Math.min(pixelWidth * 0.5, center));
                        row.labels.push(html`<div class="facet-bars-label" id="${section.label}" style="left:calc(${position}% - ${offset}px)">${section.label}</div>`);
                        left = center + pixelWidth - offset + padding;
                    }
                }

                /* right */
                if (l !== r) {
                    section = row.sections[r];
                    if (section.label && section.min < maxBars) {
                        pixelWidth = this._computeLabelWidth(section.label);
                        halfPixelWidth = pixelWidth * 0.5 + padding;
                        pixelMin = Math.max(section.min * barStep + halfBar, 0);
                        pixelMax = Math.min(section.max * barStep - halfBar, width);
                        center = (pixelMin + pixelMax) * 0.5;
                        if (right === width || (center - halfPixelWidth >= left && center + halfPixelWidth <= right)) {
                            this._addMarker(section, barStepPercentage, row.ticks);
                            position = (100 - ((center / width) * 100)).toFixed(2);
                            offset = Math.round(Math.min(pixelWidth * 0.5, width - center));
                            row.labels.push(html`<div class="facet-bars-label" style="right:calc(${position}% - ${offset}px)">${section.label}</div>`);
                            right = center - pixelWidth + offset - padding;
                        }
                    }
                }
            }
        }
    }

    private _capRows(rows: LabelRow[], percentage: string): void {
        for (let i = 0, n = rows.length; i < n; i++) {
            this._capRow(rows[i], percentage);
        }
    }

    private _capRow(row: LabelRow, percentage: string): void {
        const section = row.section;
        if (section && section.label && this.drawDelimiters) {
            row.ticks.push(html`<div class="facet-bars-labels-tick" style="left:${percentage}%"></div>`);
        }
        row.section = null;
    }

    private _getLabels(value: FacetBarsValueData|null, index: number, drawIndexLabels: boolean): string[]|null {
        if (value) {
            if (value.label) {
                return Array.isArray(value.label) ? value.label : [value.label];
            }
            return drawIndexLabels ? [`${index}`] : null;
        }
        return null;
    }

    private _computeLabelWidth(label: string): number {
        this.labelContext.font = '10px "IBM Plex Sans", sans-serif';
        return this.labelContext.measureText(label).width;
    }

    private _addMarker(section: LabelSection, barStepPercentage: number, ticks: TemplateResult[]): void {
        ticks.push(html`
        <div class="facet-bars-labels-marker" style="left:
        ${Math.max(section.min * barStepPercentage + barStepPercentage * 0.5, 0).toFixed(2)}%;
        right:${Math.max(100 - section.max * barStepPercentage + barStepPercentage * 0.5, 0).toFixed(2)}%"
        ></div>
        `);
    }
}

// Register the custom element if it hasn't been registered yet
if (!customElements.get('facet-bars-labels')) {
    customElements.define('facet-bars-labels', FacetBarsLabels);
}
