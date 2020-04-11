'use strict';
import * as vscode from 'vscode';
import * as ntc from './ntc';
import { uniqBy, find } from 'lodash';

import { RECENT_COLORS_KEY, PREDEFINED_COLORS } from "../constants";
import BaseService from './baseService';

export default class ColorService extends BaseService {

    getRecentColors(): string[][] {
        return this.useSettingsStorage() ? this.getColorsFromSettings() : this.getColorsFromGlobalState();
    }

    saveColors(colors: string[][]): Thenable<void> {
        return this.useSettingsStorage() ? this.saveColorsInSettings(colors) : this.saveColorsInGlobalState(colors);
    }

    async addRecentColor(colorCode: string) {
        if (!colorCode) {
            return;
        }

        // Get a name for the color, if possible (hex, rgb or rgba);
        var colorName = this.getColorName(colorCode);
        var colorDef = [colorCode, colorName];

        var colors = this.getRecentColors();
        colors.unshift(colorDef);

        // Remove duplicate names (except empty entries)
        colors = uniqBy(colors, d => d[1] || Math.random());

        var maxColorCount = this.configurationSection.get('recentColorsToRemember') as number;
        colors = colors.slice(0, maxColorCount);

        await this.saveColors(colors);
    }

    getColorName(colorCode: string): string {
        try {
            if (colorCode) {
                var predefColor = find(PREDEFINED_COLORS, c => c.value === colorCode);
                if (predefColor) {
                    return predefColor.label;
                }
            }

            var colorHex = this.colorStringToHex(colorCode);
            var colorName = null;;

            if (colorHex) {
                var colorMatch = ntc.default.name(colorCode);
                colorName = colorMatch[1] && !colorMatch[1].includes(':') ? colorMatch[1] : null;
            }

            return colorName;
        } catch (e) {
            return null;
        }
    }

    getRandomColor(predefinedOnly: false = false) {
        if (predefinedOnly) {
            let predefColor = PREDEFINED_COLORS[Math.floor(Math.random() * PREDEFINED_COLORS.length)];
            return predefColor.value;
        }

        var randomColorEntry = ntc.default.random();
        return "#" + randomColorEntry[0];
    }

    private getColorsFromGlobalState(): string[][] {
        return this.context.globalState.get(RECENT_COLORS_KEY) as string[][] || [];
    }

    private getColorsFromSettings(): string[][] {
        return this.configurationSection.get(RECENT_COLORS_KEY) as string[][] || [];
    }

    private saveColorsInGlobalState(colors: string[][]): Thenable<void> {
        return this.context.globalState.update(RECENT_COLORS_KEY, colors);
    }

    private saveColorsInSettings(colors: string[][]): Thenable<void> {
        return this.configurationSection.update(RECENT_COLORS_KEY, colors, vscode.ConfigurationTarget.Global);
    }

    private colorStringToHex(colorString: string): string {
        if (!colorString) {
            return null;
        }

        colorString = colorString.trim();

        if (colorString[0] === '#') {
            return colorString.substr(0, 7);
        }

        if (/rgba?\(/.test(colorString)) {
            try {
                return this.rgbToHex(colorString);
            } catch (e) {
                return null;
            }
        }

        return null;
    }

    private rgbToHex(rgb: string): string {
        // Credits to https://css-tricks.com/converting-color-spaces-in-javascript/

        // Choose correct separator
        let sep = rgb.indexOf(",") > -1 ? "," : " ";
        let leftParenthesis = rgb.indexOf("(");
        // Turn "rgb(r,g,b)" into [r,g,b]
        var split = rgb.substr(leftParenthesis + 1).split(")")[0].split(sep);

        let r = (+split[0]).toString(16),
            g = (+split[1]).toString(16),
            b = (+split[2]).toString(16);

        if (r.length == 1)
            r = "0" + r;
        if (g.length == 1)
            g = "0" + g;
        if (b.length == 1)
            b = "0" + b;

        return "#" + r + g + b;
    }
}