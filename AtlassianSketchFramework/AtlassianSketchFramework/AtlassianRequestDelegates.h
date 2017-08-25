//
//  AtlassianURLDelegates.h
//  AtlassianSketchFramework
//
//  Created by Tim Pettersen on 7/25/17.
//  Copyright © 2017 Atlassian. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface AtlassianBaseRequestDelegate : NSObject

@property (readwrite, atomic, strong) NSProgress * progress;
@property (readwrite, atomic, strong) NSError * error;
@property (readwrite, atomic, strong) NSHTTPURLResponse * response;
@property (readwrite, atomic) bool completed;
@property (readwrite, atomic) bool failed;

@end

@interface AtlassianURLConnectionDelegate : AtlassianBaseRequestDelegate <NSURLConnectionDelegate>

@property (readwrite, atomic, strong) NSMutableData * data;

@end

@interface AtlassianURLDownloadDelegate : AtlassianBaseRequestDelegate <NSURLDownloadDelegate>

@property (readwrite, atomic, strong) NSString * filePath;

@end
