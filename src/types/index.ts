import {Socket} from 'net';

interface Rule {
    test: RegExp;
    path: string;
};

interface ClientConfig {
    watch: boolean;
    dir: string;
    remotePath: string;
    rules: Rule[];
    chunkSize: number;
    timeout: number;
};

type Done = (taskStatus?: string) => void;

interface ResData {
    fileName: string;
    error?: Error;
    taskId: string;
    isSingleFileFinish?: boolean;
    localFileName: string;
    status?: number;
};

interface File {
    remotePath: string;
    localPath: string;
};

type CommonCallBack = () => any;


type EventCallBack = (data: any) => void;

interface EventMap {
    [k: string]: EventCallBack[];
};

interface ParserConstructorParam {
    configMatchPattern?: RegExp;
    configSplitPattern?: RegExp;
    contentFinishPattern?: RegExp;
}

interface ActiveItem {
    remotePath: string;
    size?: number;
    md5?: string;
    taskId?: string;
    localFileName?: string;
}

interface ParseCallBackParam {
    type: string;
    config: ActiveItem;
    content: Buffer;
}

type BeforeParseCallBack = (chunk: Buffer) => void;
type parseConfigFinishCallBack = (activeItem: ActiveItem) => void;
type parseContentFinishCallBack = (activeItem: ActiveItem) => void;
type roundParseFinishCallBack = (param: ParseCallBackParam) => void;

interface CallBackSet {
    beforeParse: BeforeParseCallBack;
    parseConfigFinish: parseConfigFinishCallBack;
    parseContentFinish: parseContentFinishCallBack;
    roundParseFinish: roundParseFinishCallBack;
}


type AnyCallBackName = keyof CallBackSet;

type Resolve = (param: Socket) => void;
type Reject = (err: Error) => void;

type Execute = (done: Done) => void;

interface TaskConstructorParam {
    id: string;
    execute: Execute;
}

export {
    Rule,
    ClientConfig,
    Done,
    ResData,
    File,
    CommonCallBack,
    EventCallBack,
    EventMap,
    ParserConstructorParam,
    ActiveItem,
    ParseCallBackParam,
    BeforeParseCallBack,
    parseConfigFinishCallBack,
    parseContentFinishCallBack,
    roundParseFinishCallBack,
    CallBackSet,
    AnyCallBackName,
    Resolve,
    Reject,
    Socket,
    Execute,
    TaskConstructorParam
}
