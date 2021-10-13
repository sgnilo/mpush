import {
    ActiveItem,
    BeforeParseCallBack,
    parseConfigFinishCallBack,
    parseContentFinishCallBack,
    roundParseFinishCallBack,
    ParserConstructorParam,
    AnyCallBackName,
    CallBackSet
} from '../types/index';

class Parser {
    config: string;
    isConfigPart: boolean;
    activeItem: ActiveItem;
    configMatchPattern: RegExp;
    configSplitPattern: RegExp;
    contentFinishPattern: RegExp;
    beforeParse?: BeforeParseCallBack;
    parseConfigFinish?: parseConfigFinishCallBack;
    parseContentFinish?: parseContentFinishCallBack;
    roundParseFinish?: roundParseFinishCallBack;
    constructor(option?: ParserConstructorParam) {
        const {configMatchPattern, configSplitPattern, contentFinishPattern} = option || {};
        this.config = '';
        this.isConfigPart = true;
        this.activeItem = null;
        this.configMatchPattern = configMatchPattern || /^\$.+\$$/;
        this.configSplitPattern = configSplitPattern || /\$/;
        this.contentFinishPattern = contentFinishPattern || /(\r\n)$/;
    }

    /**
     * 
     * @param {'beforeParse'|'parseConfigFinish'|'parseContentFinish'|'roundParseFinish'} eventName 回调调用时机
     * @param {Function} callBack 回调函数
     */
    on(eventName: AnyCallBackName, callBack: CallBackSet[AnyCallBackName]) {
        // @ts-ignore
        this[eventName] = callBack;
    }

    /**
     * 
     * @description 解析config格式的buffer
     * @param {Buffer} chunk 需要进行解析的buffer
     */
    parseConfig(chunk: Buffer) {
        this.config += chunk.toString('utf-8');
        if (this.configMatchPattern.test(this.config)) {
            this.activeItem = JSON.parse(this.config.replace(/\$/g, ''));
            this.isConfigPart = false;
            this.config = '';
            this.parseConfigFinish && this.parseConfigFinish(this.activeItem);
        }
        this.roundParseFinish && this.roundParseFinish({type: 'config', content: chunk, config: this.activeItem});
    }

    /**
     * @description 更新config中的任务类型
     */
    remakeTaskId() {
        const taskId = this.activeItem.taskId;
        taskId && /config\-push/g.test(taskId)
        && (this.activeItem.taskId = taskId.replace('config-push', 'content-push'));
    }

    /**
     * 
     * @description 解析content格式的buffer
     * @param {Buffer} chunk 需要进行解析的buffer
     */
    parseContent(chunk: Buffer) {
        let buffer = chunk;
        this.remakeTaskId();
        let chunkText = chunk.toString('utf-8');
        if (this.contentFinishPattern.test(chunkText)) {
            chunkText = chunkText.replace(this.contentFinishPattern, '');
            buffer = Buffer.alloc(chunkText.length, chunkText);
            this.isConfigPart = true;
            setTimeout(() => {
                this.parseContentFinish && this.parseContentFinish(this.activeItem);
            }, 0);
        }
        this.roundParseFinish && this.roundParseFinish({type: 'content', content: buffer, config: this.activeItem});
    }

    /**
     * 
     * @description 解析整个buffer
     * @param chunk 需要进行解析的buffer
     */
    parse(chunk: Buffer) {
        this.beforeParse && this.beforeParse(chunk);
        this.isConfigPart ? this.parseConfig(chunk) : this.parseContent(chunk);
    }
}

export {
    Parser
}
