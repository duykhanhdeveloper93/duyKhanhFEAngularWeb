export const ttlCookies = 604800000;

export enum CookieEnum {
    ACCESS_TOKEN_KEY = 'u-s',
    LOGGED_IN = 'logged-in',
    CLIENT_ID = 'client-id',
    REFRESH_TOKEN_KEY = `u-s-r`,
    KEEP_SESSION = `k-s`,
    GUEST_ACCESS_TOKEN_KEY = 'u-s-g',
    GUEST = `u-guest`,
}

export enum GenderEnum {
    FEMALE,
    MALE,
    OTHER,
}

export enum ActiveType {
    IPPHONE_SOFTPHONE,
    MOBILE,
    WEBRTC,
}

export enum SynchronizedTypeEnum {
    NOT_SYNCHRONIZED,
    SYNCHRONIZED,
    PAUSE_SYNCHRONIZED,
}

export const genders = ['Nữ', 'Nam', 'Khác'];

export enum CustomerMultiFieldTypeEnum {
    FACBOOK,
    INSTAGRAM,
    SKYPE,
    TELEGRAM,
    ZALO,
    EMAIL,
    PHONE,
    OTHER_SOCIAL,
}

export enum Dashboard_Communication_Type_Enum {
    CALL,
    LIVE_CHAT,
    FACEBOOK_MESSAGE,
    FACEBOOK_COMMENT,
    ZALO_MESSAGE,
    EMAIL,
    TELEGRAM_MESSAGE,
    VIBER,
    GOOGLE_BUSINESS_MESSAGE,
}
export enum SocialTitle {
    FACBOOK = 'Facebook',
    INSTAGRAM = 'Instagram',
    SKYPE = 'Skype',
    TELEGRAM = 'Telegram',
    ZALO = 'Zalo',
    OTHER_SOCIAL = 'Khác',
    GOOGLE_BUSINESS_MESSAGE = 'Google Business',
}

export interface User {
    id: number;
    voiceUserId?: number;
    name: string;
    loginName: string;
    fullName: string;
    fullNameVn: string;
    firstName: string;
    lastName: string;
}

export interface Department {
    id: number;
    createdAt: string;
    modifiedAt: string;
    name: string;
    code: string;
    voiceDepartmentId: number;
    site: {
        id: number;
        createdAt: string;
        modifiedAt: string;
        alias: string;
        status: number;
        domain: string;
    };
}

export enum ResponseCodeEnum {
    /**
     * Đăng nhập IAMP thất bại
     */
    IMAP_LOGIN_FAILED = 10002,
    /**
     * Đăng nhập POP3 thất bại
     */
    POP3_LOGIN_FAILED = 10003,
    /**
     * Địa chỉ server mail không tìm thấy
     */
    MAIL_ENOTFOUND = 10004,
    /**
     * Timed out while connecting to server
     */
    TIMEOUT_CONNECT_MAIL_SERVER = 10005,
    /**
     * Dữ liệu không đúng định dạng
     */
    INVALID_DATA = 20001,
    /**
     * Refresh token không hợp lệ
     */
    INVALID_RT = 20002,
    /**
     * Token không hợp lệ
     */
    INVALID_TOKEN = 20003,
    /**
     * Cặp queue và site không hợp lệ
     */
    INVALID_QUEUE_SITE = 20009,
    /**
     * Không thể xóa email session vì phiên chưa được tiếp nhận
     */
    INVALID_CHAT_SESSION_EMAIL_DELETE = 20010,
    /**
     * Không thể xóa cấu hình mail do cấu hình đang được kích hoạt.
     */
    CAN_NOT_DELETE_CONFIG_EMAIL_BECAUSE_INVALID_STATUS = 20010,
    /**
     * Trạng thái user không phù hợp để chuyển sang trạng thái mới
     */
    INVALID_USER_STATUS = 20004,
    /**
     * Token hết hạn
     */
    TOKEN_EXPIRED = 30001,
    /**
     * Không thể xác định được lỗi khi verify token
     */
    UN_RECOGNIZE_ERROR_WHEN_VERIFY_TOKEN = 30002,
    /**
     * Yêu cầu đăng nhập
     */
    REQUIRE_SIGN_IN = 40001,
    /**
     * Cặp mật khẩu thay đổi không match với nhau.
     */
    PAIR_PW_CHANGE_NOT_MATCH = 40002,
    /**
     * Mật khẩu hiện tại không đúng
     */
    C_PW_NOT_CORRECT = 40003,
    /**
     * Tài khoản và mật khẩu không chính xác lúc đăng nhập
     */
    U_PW_NOT_CORRECT = 40004,
    /**
     * Mật khẩu mới phải khác mật khẩu hiện tại
     */
    N_PW_MUST_DIFF_C_PW = 40005,
    /**
     * Thông tin user credential đã tồn tại
     */
    EXISTED_USER_C = 50001,
    /**
     * Thông tin user (loginName - workEmail) đã tồn tại
     */
    EXISTED_USER = 50002,
    /**
     * Không tồn tại user
     */
    NOT_EXIST_USER = 50003,
    /**
     * User đang ở trạng thái vô hiệu hóa nên không thể đăng nhập
     */
    USER_DEACTIVE = 500031,
    /**
     * Đã tồn tại dữ liệu theo 1 tiêu chí nào đó -  title, name ...
     */

    EXISTED_DATA = 50004,

    /**
     * Login name đã tồn tại
     */
    EXISTED_LOGIN_NAME = 50005,
    /**
     * Email đã tồn tại
     */
    EXISTED_EMAIL = 50006,
    /**
     * Work phone number khách hàng đã tồn tại
     */
    EXISTED_TEMPLATE_EMAIL_NAME = 50014,
    /**
     * Kênh đang tồn tại phiên chat đang hoạt động
     */
    IS_EXIST_CHAT_SESSION_ACTIVE = 50056,
    /**
     * Không thể cập nhật vì người dùng là đã được thêm vào agent team nhưng lại bỏ các role có thể call sang voice
     */
    ERROR_UPDATE_NOT_ENOUGH_ROLE = 5000111,
    /**
     * Số điện thoại của người dùng đã tồn tại (trong site)
     */
    EXISTED_USER_PHONE = 5000666,
    /**
     * Không có quyền thay đổi mật khẩu
     */
    NOT_PER_CHANGE_PASS = 5000999,
    /**
     * Site đã tồn tại
     */
    EXISTED_DOMAIN = 50007,
    /**
     * Alias đã tồn tại
     */
    EXISTED_ALIAS = 50008,
    /**
     * Không tồn tại queue
     */
    NOT_EXIST_QUEUE = 50022,
    /**
     * Trang livechat đã được sử dụng
     */
    USED_LIVECHAT = 50031,
    /**
     * Config channel đã có livechat
     */
    CONFIG_CHANNEL_HAS_LIVECHAT = 50032,
    /**
     * Đã tồn tại tên config channel
     */
    EXISTED_CONFIG_CHANNEL_NAME = 50033,
    /**
     * Trên queue chỉ có 1 người online
     */
    ONLY_ONE_USER_IN_QUEUE = 50035,
    /**
     * Không tìm thấy cấu hình user và extension
     */
    NOT_FOUND_USER_EXTENSION = 50036,
    /**
     * Người dùng chưa được thêm vào queue
     */
    NOT_EXISTS_USER_IN_QUEUE = 50037,
    /**
     * Đã tồn tại cấu hình email
     */
    EXISTS_CONFIG_EMAIL = 50038,
    /**
     * Giá trị Gmail refresh token hết hạn, không hợp lệ.
     */
    INVALID_GMAIL_REFRESH_TOKEN = 50039,
    /**
     * Trùng dữ liệu
     */
    ER_DUP_ENTRY = 10001,
    /**
     * Trùng địa chỉ mail
     */
    ER_DUP_EMAIL = 10002,
    /**
     * Không hỗ trợ phương thức, hàm hoặc service.
     */
    NOT_SUPPORT_SERVICE = 10003,

    /** Dữ liệu đang được liên kết với dữ liệu khác.*/
    DATA_BEING_LINKED = 10004,
    /**
     * Đã đăng nhập
     */
    LOGGED_IN = 10005,
    /**
     * Lỗi không cập nhật được dữ liệu và db.
     */
    UPDATE_FAIL = 10006,
    /**
     * Quá giới hợn cho phép.
     */
    LIMIT_SIZE = 10007,
    /**
     * Không tìm thấy dữ liệu.
     */
    NOT_FOUND = 10008,

    /**
     *  Work phone number khách hàng đã tồn tại
     */
    EXISTED_CUSTOMER_WORK_PHONE = 50013,

    /**
     * Không tìm thấy dữ liệu.
     */

    EXISTED_CALL_FORWARD_PHONE = 70001,
    /**
     * CALL_FORWARD đã tồn tại
     */

    EXISTED_AGENT_TEAM_ALIAS = 80000,
    /**
     * User Agent Team ALIAS đã tồn tại
     */
    EXISTED_AGENT_TEAM_USER = 80001,
    /**
     * User Agent Team đã tồn tại
     */
    NOT_CONNECT_API_VOICE_ADD_AGENT_TEAM = 80002,
    /**
     * Lỗi kết nối
     */

    NOT_CONNECT_API_VOICE = 99999,
    /**
     * Xóa call-forward không thành công, call-forward không thuộc phòng ban của bạn
     */

    NOT_DELETE_BECAUSE_CALL_FORWARD_NOT_MATCH_DEPARTMENT = 71004,

    //=====================Ngoại lệ của thêm mới LINK agent team bên voice===================
    /**
     * Gán user vào agent team không thành công, user không hợp lệ
     */
    EXTERNAL_ADD_LINK_AGENT_TEAM_30 = 81030,
    /**
     * Gán user vào agent team không thành công, không hợp lệ trường agent_team_id*
     */
    EXTERNAL_ADD_LINK_AGENT_TEAM_31 = 81031,
    /**
     * Trường priority không hợp lệ, phải là số từ 1 đến …
     */
    EXTERNAL_ADD_LINK_AGENT_TEAM_32 = 81032,
    /**
     * Trường priority không hợp lệ, phải là 1
     */
    EXTERNAL_ADD_LINK_AGENT_TEAM_33 = 81033,
    /**
     * Trường priority không hợp lệ, phải là ...
     */
    EXTERNAL_ADD_LINK_AGENT_TEAM_34 = 81034,
    /**
     * Gán user vào agent team không thành công, user đã tồn tại
     */
    EXTERNAL_ADD_LINK_AGENT_TEAM_40 = 81040,

    //=====================Ngoại lệ của thêm mới agent team bên voice===================
    /**
     * Tên agent team không hợp lệ trường name
     */
    EXTERNAL_ADD_AGENT_TEAM_03 = 84003,
    /**
     * Tên alias đã tồn tại trên hệ thống trường alias
     */
    EXTERNAL_ADD_AGENT_TEAM_04 = 84004,
    /**
     * Phòng ban không hợp lệ trường department_id
     */
    EXTERNAL_ADD_AGENT_TEAM_05 = 84005,
    /**
     * Trường priority không hợp lệ. Chỉ chấp nhận giá trị 1 (tăng dần) hoặc 0 (Được trùng độ ưu tiên)
     */
    EXTERNAL_ADD_AGENT_TEAM_06 = 84006,
    /**
     * Lỗi thêm !
     */
    EXTERNAL_ADD_AGENT_TEAM_08 = 84008,

    //=====================Ngoại lệ của chỉnh sửa agent team bên voice===================
    /**
     * Tên agent team không hợp lệ trường name
     */
    EXTERNAL_EDIT_AGENT_TEAM_03 = 84103,
    /**
     * Tên alias đã tồn tại trên hệ thống trường alias
     */
    EXTERNAL_EDIT_AGENT_TEAM_04 = 84104,
    /**
     * Phòng ban không hợp lệ trường department_id
     */
    EXTERNAL_EDIT_AGENT_TEAM_05 = 84105,
    /**
     * Trường priority không hợp lệ. Chỉ chấp nhận giá trị 1 (tăng dần) hoặc 0 (Được trùng độ ưu tiên)
     */
    EXTERNAL_EDIT_AGENT_TEAM_06 = 84106,
    /**
     * Lỗi thêm !
     */
    EXTERNAL_EDIT_AGENT_TEAM_08 = 84108,
    /**
     * Không tìm thấy Agent Tem có mã này !
     */
    EXTERNAL_EDIT_AGENT_TEAM_09 = 84109,

    //=====================Ngoại lệ của xóa agent team bên voice===================
    /**
     * Xóa agent team không thành công, vui lòng xóa agent team khỏi user
     */
    EXTERNAL_DELETE_AGENT_TEAM_01 = 84201,
    /**
     * Xóa agent team không thành công, vui lòng xóa agent team khỏi skill group
     */
    EXTERNAL_DELETE_AGENT_TEAM_02 = 84202,
    /**
     * Xóa agent team không thành công, vui lòng xóa agent team khỏi queue user
     */
    EXTERNAL_DELETE_AGENT_TEAM_03 = 84203,
    /**
     * Xóa agent team không thành công, agent team không tồn tại
     */
    EXTERNAL_DELETE_AGENT_TEAM_04 = 84204,
    /**
     * Vui lòng nhập mã Agent Team cần xóa !
     */
    EXTERNAL_DELETE_AGENT_TEAM_07 = 84207,
    //=====================Ngoại lệ của thêm user bên voice===================
    /**
     * Họ không hợp lệ trường first_name
     */
    EXTERNAL_ADD_USER_03 = 82003,
    /**
     * Tên không hợp lệ trường lastname
     */
    EXTERNAL_ADD_USER_04 = 82004,
    /**
     * Username đã tồn tại trên hệ thống trường username
     */
    EXTERNAL_ADD_USER_05 = 82005,
    /**
     * Password không hợp lệ trường password
     */
    EXTERNAL_ADD_USER_06 = 82006,
    /**
     * Số điện thoại không hợp lệ trường mobile
     */
    EXTERNAL_ADD_USER_07 = 82007,
    /**
     * Email không hợp lệ trường email
     */
    EXTERNAL_ADD_USER_08 = 82008,
    /**
     * Department không hợp lệ trường department_id
     */
    EXTERNAL_ADD_USER_10 = 82010,
    /**
     * Username không hợp lệ trường username
     */
    EXTERNAL_ADD_USER_11 = 82011,
    /**
     * Active type không hợp lệ trường active_type
     */
    EXTERNAL_ADD_USER_12 = 82012,

    //=====================Ngoại lệ của sửa user bên voice===================
    /**
     * Họ không hợp lệ trường first_name
     */
    EXTERNAL_EDIT_USER_03 = 83003,
    /**
     * Tên không hợp lệ trường last_name
     */
    EXTERNAL_EDIT_USER_04 = 83004,
    /**
     * Password không hợp lệ trường password
     */
    /**
     * User chuyển từ không đồng bộ sang đồng bộ nhưng trong hệ thống voice đã tồn tại do hệ thống cập nhật luồng mới
     */
    EXTERNAL_EDIT_USER_05 = 83005,
    /**
     * Password không hợp lệ trường password
     */
    EXTERNAL_EDIT_USER_06 = 83006,
    /**
     * Số điện thoại không hợp lệ trường mobile
     */
    EXTERNAL_EDIT_USER_07 = 83007,
    /**
     * Email không hợp lệ trường email
     */
    EXTERNAL_EDIT_USER_08 = 83008,
    /**
     * Department không hợp lệ trường department_id
     */
    EXTERNAL_EDIT_USER_10 = 83010,
    /**
     * User không tồn tại
     */
    EXTERNAL_EDIT_USER_11 = 83011,
    /**
     * Active type không hợp lệ trường active_type
     */
    EXTERNAL_EDIT_USER_12 = 83012,

    //=====================Ngoại lệ của xóa user bên voice===================
    /**
     * Xóa user không thành công, vui lòng xóa user khỏi agent team
     */
    EXTERNAL_DELETE_USER_01 = 82101,
    /**
     * Xóa user không thành công, user không tồn tại
     */
    EXTERNAL_DELETE_USER_02 = 82102,
    /**
     * Xóa user không thành công, user không thuộc phòng ban của bạn
     */
    EXTERNAL_DELETE_USER_04 = 82104,
    /**
     * Xóa user không thành công, user không thuộc phòng ban của bạn
     */
    EXTERNAL_DELETE_USER_05 = 82105,
    //=====================Ngoại lệ của thêm branch bên voice===================
    /**
     * Name không hợp lệ
     */
    EXTERNAL_NAME_VALID = 80006,
    /**
     * Alias không hợp lệ
     */
    EXTERNAL_ALIAS_VALID = 80007,
    /**
     * Tài khoản không có quyền truy cập
     */
    NOT_PERMISION_LOGIN = 50053,
    /**
     * Site đang ở trạng thái kích hoạt
     */
    SITE_IS_ACTIVE = 50054,

    //=====================Ngoại lệ package===================
    /**
     * Phòng ban đã tồn tại trong gói cước
     */
    PACK_DEP_EXISTED = 90000,
    /**
     * Không thể thêm phòng ban do quá số lượng giới hạn người dùng của gói cước
     */
    OVER_USER_IN_PACKAGE = 90001,
    /**
     * Gói cước đã được thêm số lượng người dùng lớn hơn giới hạn cho phép. Vui lòng kiểm tra lại!
     */
    NOT_CHANGE_LIMITED_USER_PACKAGE = 90002,
    /**
     * Phòng ban này đã được thêm ở một gói cước khác
     */
    DEP_EXISTED_ANOTHER_PACKAGE = 90003,
    /**
     * Chỉ super admin mới có quyền thêm quyền gói cước
     */
    ONLY_SUPER_ADMIN_ADD_PER_PACKAGE = 90004,
    /**
     * Phòng ban có số người dùng đã thêm vượt quá giới hạn của gói cước. Vui lòng liên hệ bộ phận kỹ thuật để được xử lý!
     */
    ADD_USER_OVER_PACKAGE = 5000222,
    //=====================Ngoại lệ trạng thái chat===================
    /**
     * Gọi thay đổi trạng thái chat liên tục
     */
    SPAM_CHAGE_CHAT_STATUS = 120001,
    /**
     * Mã captcha không hợp lệ
     */
    INVALID_CAPTCHA = 50058,
    /**
     * Mã captcha hết hiệu lực
     */
    CAPTCHA_EXPIRED = 50059,
}

export enum WsResponseCodeEnum {
    LOCK = 'Lock wait timeout exceeded; try restarting transaction',
    MAX_CCU_IN_AGENT = 50054,
    /**
     * Không thể từ chối phiên chat
     */
    NOT_REJECT_CHAT_SESSION = 60001,
    /**
     * Không thể chuyển người
     */
    NOT_CHANGE_USER_RECEIVE_CHAT_SESSION = 60002,
    /**
     * Không thể từ chối phiên chat do chi có 1 user online
     */
    NOT_REJECT_CHAT_SESSION_BY_ONE_USER_ONLINE = 60005,
    /**
     * Tin nhắn được chuyển đến vẫn đang trong hội thoại, vui lòng tiếp nhận hoặc chuyển người
     */
    NOT_REJECT_A_RECEIVED_CHAT_SESSION = 60006,
    /**
     * Không thể chuyển người
     */
    NOT_CHANGE_USER_IN_CHAT_SESSION = 60007,
    /**
     * Không có agent trong queue
     */
    QUEUE_EMPTY = 60003,
    /**
     * Trạng thái chat là offline
     */
    USER_CHAT_STATUS_IS_OFFLINE = 50058,
    /**
     * Phiên được phân phối đến tất cả
     */
    DEVIDE_TYPE_ALL = 50059,
    /**
     * Không tồn tại cấu hình kênh
     */
    NOT_EXISTS_CONFIG_CHANNEL = 50038,
    MUST_RECEIVE_CHAT_SESSION = 50079,
}

export enum ChatTypeEnum {
    INTERNAL_CHAT,
    LIVE_CHAT,
    FACEBOOK_MESSAGE,
    FACEBOOK_COMMENT,
    ZALO_MESSAGE,
    EMAIL,
    TELEGRAM_MESSAGE,
    VIBER_MESSAGE,
    GOOGLE_BUSINESS_MESSAGE,
}

export enum StatusChatSessions {
    CREATED,
    CHOSE,
    MAPPED,
    ENDED,
}

export enum SocialTypeEnum {
    INTERNAL,
    LIVE_CHAT,
    FACEBOOK_MESSAGE,
    FACEBOOK_COMMENT,
    ZALO,
    EMAIL,
    TELEGRAM,
    VIBER,
}

export enum ActivedTypeEnum {
    DISABLE,
    ACTIVED,
}

export enum PriorityTypeEnum {
    LIKE,
    INCREMENT,
}

export const regexs = {
    regex_password:
        /^(?=.*\d)(?=.*[~!@#$%^&*_\-+=`|\(){}'<>,.?\/])(?=.*[a-z])(?=.*[A-Z])(?=\S+$).{8,16}$/,
    regex_email: /[a-z0-9]+@[a-z]+\.[a-z]{2,3}/,
    regex_extension: /^[0-9]{3,8}$/,
    regex_phone: /^(03|05|07|08|09)[0-9]{8}$/,
    vi_pattern:
        /^[a-zA-Z0-9\'ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳýỵỷỹ\s|_]+$/,
    vi_txt_pattern:
        /^[a-zA-Z0-9\'ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s|_\)(,-.]+$/,
    dateStrPattern:
        /^(0[1-9]|[1-2]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}(,(0[1-9]|[1-2]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4})*$/,
    domainPattern:
        /^(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/,
    special_char: /^[a-zA-Z0-9\'À-ỹ\s|_,.!?]+$/,
    numpad: /^[0-9*@#+]{1,15}$/,
    dateTxtRegex: /(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-(19|20)\d{2}/,
    dateRegexImport: /([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/,
    callQueueAlias: /^[A-Za-z0-9À-ỹ\-_]+$/,
    siteAlias: /^[^\W_]+(?:_[^\W_]+)*$/,
    regexPhoneSimple: /^(0)[0-9]{9}$/,
    addressNamePattern:
        /^[a-zA-Z0-9,\-'_ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳýỵỷỹ\s)(_-]+$/,
    vietnameseNamePattern:
        /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s\|_]+$/,
    phoneNumberPattern: /^(03|05|07|08|09)[0-9]{8}$/,
    workEmailPattern: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
    usernameRegex: /^[a-zA-Z0-9]{3,32}$/,
    regexStringNoSpecific:
        /^[a-zA-Z0-9\'ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s|_\)(,-.]+$/,
    regexNumberOnly: /^[0-9]{1,}$/,
};

export const ROUTE_PATH = {
    CUSTOMER_DETAIL: '/customer/detail/',
    CUSTOMER_SERVICE_CHANNEL_DETAIL: '/customer-service-channel/detail/',
    CUSTOMER_SERVICE_CHANNEL_DETAIL_VIEW: '/customer-service-channel/view/',
    CUSTOMER_SERVICE_CHANNEL: '/customer-service-channel',
    CUSTOMER_SERVICE_CHANNEL_DETAIL_NEW: '/customer-service-channel/new',
    ZALO_CHANNEL_LIST: '/customer-service-channel/zalo-channel',
    FACEBOOK_CHANNEL_LIST: '/customer-service-channel/facebook-channel',
    TELEGRAM_CHANNEL_LIST: '/customer-service-channel/telegram-channel',
    GOOGLE_LIST: 'customer-service-channel/google-business',

    WIDGET_LIST: '/website-widgets',
    WIDGET_CREATE: '/website-widgets/add',
    WIDGET_EDIT: '/website-widgets/edit/',

    MAIL_CONFIG_LISTING: 'mail-setting/config',
    MAIL_CONFIG_NEW: 'mail-setting/config/new',
    MAIL_CONFIG_EDIT: 'mail-setting/config',

    MAIL_TEMPLATE_LISTING: 'mail-setting/template',
    MAIL_TEMPLATE_NEW: 'mail-setting/template/new',
    MAIL_TEMPLATE_EDIT: 'mail-setting/template',

    MAIL_INBOX_NEW: 'mail-setting/inbox/new',
    MAIL_INBOX_LISTING: 'mail-setting/inbox',
    MAIL_INBOX_DETAIL: 'mail-setting/inbox/detail',

    MAIL_OUTBOX_LISTING: 'mail-setting/outbox',
    MAIL_OUTBOX_DETAIL: 'mail-setting/outbox/detail',
};

export const TOASTR_TITLE = {
    HAS_ERROR_OCCUR: 'Có lỗi xảy ra',
    NOTI: 'Thông báo',
    SUCCESS: 'Thành công',
    ERROR: 'Lỗi',
    WARNING: 'Cảnh bảo',
};

export const TOASTR_MSG = {
    CREATE_SUCCESSFULLY: 'Thêm mới thành công',
    UPDATE_SUCCESSFULLY: 'Cập nhật thông tin thành công',
    DELETE_SUCCESSFULLY: 'Xóa thành công',
    RETRY: 'Vui lòng thử lại.',
    RETRY_OR_CONTACT_ADMIN:
        'Có lỗi xảy ra. Vui lòng thử lại hoặc liên hệ với quản trị viên để được hỗ trợ',
    NOT_CHANGE_USER_IN_CHAT_SESSION: 'Không thể chuyển người.',
    CAN_NOT_CHANGE_USER_RECEIVE_CHAT_SESSION:
        'Không thể chuyển người do phiên chat đang được phân phối đến tất cả các khai thác viên.',
    USER_CHAT_STATUS_IS_OFFLINE:
        'Khai thác viên không thể tiếp nhận phiên chat.',
    NOT_REJECT_CHAT_SESSION_BY_ONE_USER_ONLINE:
        'Hiện tại chỉ có 1 khai thác viên đang ở trạng thái hoạt động.',
    NOT_REJECT_A_RECEIVED_CHAT_SESSION:
        'Tin nhắn được chuyển đến vẫn đang trong hội thoại, vui lòng tiếp nhận hoặc chuyển người.',
    DEVIDE_TYPE_ALL: 'Không thể chuyển người cùng kênh.',
    CAN_NOT_REJECT_CHAT_SESSION:
        'Từ chối thât bại. Vui lòng tiếp nhận tin nhắn.',
    MAX_CCU_IN_AGENT: 'Kỹ thuật viên không thể tiếp nhận phiên chat.',
    MUST_RECEIVE_CHAT_SESSION: 'Không thể từ chối phiên. Vui lòng tiếp nhận.',
    NOT_EXISTS_CONFIG_CHANNEL: 'Không tồn tại cấu hình kênh.',
    QUEUE_EMPTY: 'Không có agent trong kênh để chuyển phiên chat.',
    CHANGE_USER_SUCCESS: 'Chuyển người thành công.',
    END_SESSION_SUCCESS: 'Đã kết thúc cuộc hội thoại.',
    FORM_REQUIRE: 'Vui lòng nhập đủ thông tin bắt buộc.',
    NOT_FOUND: 'Không tìm thấy thông tin.',
    NO_ACCESS: 'Bạn không có quyền truy cập vào tính năng này.',
    CONNECT_MIC: 'Vui lòng kết nối mic để thực hiện cuộc gọi.',
};

export const CONSTANTS = {
    NO_FILE_UPLOAD: 'Không có tệp được chọn',
};

/**
 * File extensions
 */
export const fileExtensions = [
    //#region image
    'jpg',
    'png',
    'gif',
    'jpeg',
    'bmp',
    'tiff',
    'webp',
    //#endregion
    //#region video
    'mp4',
    'mov',
    'avi',
    'flv',
    '3gp',
    'mkv',
    'mpeg',
    'webm',
    //#endregion
    //#region audio
    'mp3',
    'wav',
    'aac',
    //#endregion
    //#region file
    'pdf',
    'doc',
    'docx',
    'xlsx',
    'txt',
    'xls',
    'ppt',
    'pptx',
    'csv',
    //#endregion
    //#region zip, rar
    'zip',
    'rar',
    //#endregion
    'rtf',
];

export const MB = 1048576;

export const maxSizeUploaded = 26214400; // byte - 25MB

export const totalSizePerUploading = 104857600; // byte - 100MB

/**
 * Loại tin nhắn gửi đi
 */
export enum MessageTypeEnum {
    TEXT,
    ATTACHMENTS,
    NOTIFICATION,
    SURVEY,
    SURVEY_RESULT,
}

export const SYSTEM = 'Hệ thống';

export const addressNamePattern =
    /^[a-zA-Z0-9,\-'_ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s]+$/;

export const vietnameseNamePattern =
    /^[a-zA-Z0-9\'ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s|_]+$/;

export const phoneNumberPattern = /^(03|05|07|08|09)[0-9]{8}$/;

export const phoneNumberFreePattern = /^(0)[0-9]{3,11}$/;

export enum NotificationType {
    MESSAGE,
    EMAIL,
    TICKET_RECEIVE,
    TICKET_FOLLOW,
    TICKET_REPLY,
    TICKET_NEED_PROCESSING,
}
export enum NotiMenu {
    DEFAULT = 'default',
    SETTING = 'setting',
}
export enum ChatOptionEnum {
    CHAT_DEFAULT,
    CHAT_OUT,
}
